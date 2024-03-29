import {Injectable} from '@angular/core';
import {NeighboursService} from "./neighbours.service";
import {ConstantService} from "../constant.service";
import {PeerConnectionService} from "./peer-connection.service";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Observable, Subject, throwError} from 'rxjs';
import {catchError, retry} from 'rxjs/operators';
import {LoggerService} from "./logger.service";
import {WebrtcUtilService} from "./webrtc-util.service";
import {DataChannelService} from "./data-channel.service";
import {io} from "socket.io-client";
import * as Blockly from "blockly";

@Injectable(
  {
    providedIn: 'root'
  }
)
export class WebrtcService {

  //notify client connection is successful
  connectedSubject: Subject<any> = new Subject<any>();
  notifySubject: Subject<any> = new Subject<any>();
  messageSubject: Subject<any> = new Subject<any>();

  constructor(
    private neighbourService: NeighboursService,
    private constant: ConstantService,
    private dataChannelService: DataChannelService,
    private peerConnectionService: PeerConnectionService,
    private webrtcUtilService: WebrtcUtilService,
    private logger: LoggerService,
    private http: HttpClient,
  ) {
  }

  /*
  communicate with server
   */

  /*
  @input: room_id
  @output: error message
   */
  connect(room_id: string, username: string, name: string): string {
    this.webrtcUtilService.username = username;
    this.webrtcUtilService.name = name;

    let that = this;

    try {
      let socket = this.webrtcUtilService.socket = io("wss://www.xytcloud.ltd:4433", {
        path: "/blockly",
        reconnection: false,
      });

      /*
      socket 监听事件部分
       */
      socket.on('connect',()=>{
        socket.emit('joinRoom', room_id, name, username,
          (neighbours) => {
            that.handle_peersEvent(neighbours);
          })
      })

      socket.on("disconnect", (reason) => {
        if (reason === "io server disconnect" || reason === 'io client disconnect') {
          // the disconnection was initiated by the server, you need to reconnect manually
          that.clear()
        }
        // else the socket will automatically try to reconnect
      });

      socket.on("new_peer",(data)=>{
        that.handle_new_peerEvent(data);
      })

      socket.on("ice_candidate",(res)=>{
        let data = JSON.parse(res).data;
        that.handle_ice_candidateEvent(data);
      })

      socket.on("offer",(res)=>{
        let data = JSON.parse(res).data;
        that.handle_offerEvent(data);
      })

      socket.on("answer",(res)=>{
        let data = JSON.parse(res).data;
        that.handle_answerEvent(data);
      })

      socket.on("remove_peer",(res)=>{
        let data = JSON.parse(res).data;
        that.handle_remove_peerEvent(data);
      })
      return null;
    } catch (e) {
      console.log(e)
      return e.toString()
    }
  }

  broadcast(message, time) {
    for (let neighbour of this.neighbourService.neighbours) {
      this.sendMessage(message, time, neighbour.socketId);
    }
  };

  sendMessage(message, time, socketId) {
    let sendData = {
      type: "__chatMessage",
      data: message,
      time: time,
    };
    let neighbour = this.neighbourService.getNeighbourBySocketId(socketId);
    let dataChannel = neighbour.data_channel;
    if (dataChannel.readyState.toLowerCase() === 'open') {
      dataChannel.send(JSON.stringify(sendData));
    }
  };

  /*
  对服务器发送的信息进行处理的部分
   */
  handle_peersEvent(data) {
    this.peerConnectionService.handle_peersEvent(data);
    this.webrtcUtilService.connected = true;
    //this param is unused
    this.connectedSubject.next(0);
  }

  handle_ice_candidateEvent(data) {
    this.peerConnectionService.handle_ice_candidateEvent(data);
  }

  handle_new_peerEvent(data) {
    this.peerConnectionService.handle_new_peerEvent(data);
    this.messageSubject.next({type: 'success', content: data.name + '进入了房间中',})
  }

  handle_remove_peerEvent(data) {
    let neighbour = this.neighbourService.getNeighbourBySocketId(data.socketId);
    //bug
    let name = neighbour.name;
    let username = neighbour.username;

    this.peerConnectionService.handle_remove_peerEvent(data, neighbour);
    this.messageSubject.next({type: 'success', content: data.name + '退出了房间',})
  }

  handle_offerEvent(data) {
    this.peerConnectionService.handle_offerEvent(data);
  }

  handle_answerEvent(data) {
    this.peerConnectionService.handle_answerEvent(data);
  }

  /*
  stream part
   */

  /*
  @input device, indicates which device is shared. camera or desktop
   */
  changeShareDevice(device: string) {
    let that = this;
    switch (device) {
      case 'shareCamera':
        if (this.constant.getUserMedia) {
          // 调用用户媒体设备, 访问摄像头
          this.getUserMediaFun(
            {
              "video": true,
              "audio": true
            },
            function (stream) {
              that.webrtcUtilService.localMediaStream = stream;
              that.removeLocalTrackAndAddNewTrackToNeighboursStream();
              that.messageSubject.next({type: 'success', content: '视频流切换成功'})
            },
            function (error) {
              that.clear();
              that.notifySubject.next({type: 'error', title: '视频流创建出现错误', content: error});
            });
        } else {
          // TODO
          // that.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
        }
        break;
      case 'shareDesktop':
        //@ts-ignore
        navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
          .then(function (stream) {
            that.webrtcUtilService.localMediaStream = stream;
            that.removeLocalTrackAndAddNewTrackToNeighboursStream();
            that.messageSubject.next({type: 'success', content: '视频流切换成功'})
          })
          .catch(function (error) {
            that.clear();
            that.notifySubject.next({type: 'error', title: '视频流创建出现错误', content: error});
          });
        break;
    }
  }

  /*
  @input: videoState
  @output: boolean
   */
  changeVideoStreamEnabledState(videoState: boolean) {
    if (this.webrtcUtilService.localMediaStream !== null) {
      if (this.webrtcUtilService.localMediaStream.getVideoTracks().length > 0)
        this.webrtcUtilService.localMediaStream.getVideoTracks()[0].enabled = videoState;
    }
  }

  /*
  @input: videoState
  @output: boolean
   */
  changeAudioStreamEnabledState(audioState: boolean) {
    if (this.webrtcUtilService.localMediaStream !== null) {
      if (this.webrtcUtilService.localMediaStream.getAudioTracks().length > 0)
        this.webrtcUtilService.localMediaStream.getAudioTracks()[0].enabled = audioState;
    }
  }

  closeStream(stream: MediaStream) {
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
  };

  //创建本地流媒体
  createStream(options) {
    let that = this;
    options.video = !!options.video;
    options.audio = !!options.audio;

    if (this.constant.getUserMedia) {
      // 调用用户媒体设备, 访问摄像头
      this.getUserMediaFun(
        options,
        function (stream) {
          that.webrtcUtilService.localMediaStream = stream;
          //TODO
          //gThat.emit("stream_created", stream);
          //创建视频流之后立刻静音
          that.changeAudioStreamEnabledState(false);
          that.changeVideoStreamEnabledState(false);

          that.webrtcUtilService.mediaUsable = true;
          that.notifySubject.next({type: 'success', title: '视频流创建成功', content: '视频流已经显示在右下方'});

          that.createDataChannelWithNeighbours();
          that.addLocalTrackToNeighboursStream();
        },
        function (error) {
          that.clear();
          that.notifySubject.next({type: 'error', title: '视频流创建出现错误', content: error});
          console.log(error)
        });
    } else {
      // TODO
      // that.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
    }
  };

  /*
  other part
   */
  createDataChannelWithNeighbours() {
    for (let neighbour of this.webrtcUtilService.neighbours) {
      this.dataChannelService.createDataChannel(neighbour.socketId, neighbour.peer_connection, neighbour.username);
    }
  }

  addLocalTrackToNeighboursStream() {
    for (let neighbour of this.webrtcUtilService.neighbours) {
      if (this.webrtcUtilService.localMediaStream !== null)
        this.webrtcUtilService.localMediaStream
          .getTracks()
          .forEach(track => neighbour.peer_connection.addTrack(track));
    }
  }

  removeLocalTrackAndAddNewTrackToNeighboursStream() {
    for (let neighbour of this.webrtcUtilService.neighbours) {
      let peerConnection = neighbour.peer_connection;
      let senders = peerConnection.getSenders();
      senders.forEach(sender => peerConnection.removeTrack(sender));
      this.webrtcUtilService.localMediaStream.getTracks()
        .forEach(track => peerConnection.addTrack(track));
    }
  }

  /*
  util part
   */

  shareFile(file) {
    this.dataChannelService.shareFile(file);
  }

  /*
   */
  clear() {
    //clear all the parts of service
    if(this.webrtcUtilService.socket && this.webrtcUtilService.socket.connected){
      this.webrtcUtilService.socket.disconnect();
    }
    this.webrtcUtilService.room_id = undefined;
    this.webrtcUtilService.username = undefined;
    this.webrtcUtilService.socket = undefined;
    this.webrtcUtilService.name = undefined;
    this.webrtcUtilService.mediaUsable = false;
    this.closeStream(this.webrtcUtilService.localMediaStream);
    this.webrtcUtilService.localMediaStream = undefined;
    this.webrtcUtilService.connected = false;
    this.webrtcUtilService.events = {};
    for (let neighbour of this.neighbourService.neighbours) {
      this.webrtcUtilService.closePeerConnection(neighbour.peer_connection);
      this.webrtcUtilService.closeDataChannel(neighbour.data_channel);
    }
    this.webrtcUtilService.unreadChatMessageNum = 0;
    this.webrtcUtilService.chatMessages = [];
    this.webrtcUtilService.receiveFiles = {}
    this.neighbourService.clear();
  }

  //访问用户媒体设备的兼容方法
  getUserMediaFun(constraints, success, error) {
    if (navigator.mediaDevices.getUserMedia) {
      //最新的标准API
      navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
    } else if (navigator.getUserMedia) {
      //旧版API
      navigator.getUserMedia(constraints, success, error);
    } else {
      // TODO
      // gThat.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
    }
  }
}

