import {Injectable} from '@angular/core';
import {NeighboursService} from "./neighbours.service";
import {ConstantService} from "../constant.service";
import {PeerConnectionService} from "./peer-connection.service";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {LoggerService} from "./logger.service";
import {WebrtcUtilService} from "./webrtc-util.service";
import {DataChannelService} from "./data-channel.service";

@Injectable(
  {
    providedIn: 'root'
  }
)
export class WebrtcService {
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
  connect(room_id: number, username: string, name: string): string {
    this.webrtcUtilService.username = username;
    this.webrtcUtilService.name = name;

    try {
      let socket = this.webrtcUtilService.socket = new WebSocket(this.webrtcUtilService.path);

      /*
      socket 监听事件部分
       */
      socket.onopen = this.socketOnOpen

      socket.onclose = this.socketOnClose

      socket.onerror = this.socketOnError

      socket.onmessage = this.socketOnMessage

      return null;
    } catch (e) {
      return e.toString()
    }
  }

  broadcast(message, time) {
    for(let neighbour of this.neighbourService.neighbours){
      this.sendMessage(message, time, neighbour.socketId);
    }
  };

  sendMessage(message, time, socketId) {
    let sendData = message.type === "canvas" ? message : {
      type: "__msg",
      data: message,
      time: time,
    };
    let neighbour = this.neighbourService.getNeighbourBySocketId(socketId);
    let dataChannel = neighbour.data_channel;
    if (dataChannel.readyState.toLowerCase() === 'open') {
      dataChannel.send(JSON.stringify(sendData));
    }
  };

  testServerConnection(): boolean{
    let res = this.http.get(
      'https://xytcloud.ltd:8001/testConnect',
      {
        observe: 'response',
        responseType: 'json',
      }).pipe(
      catchError(WebrtcService.handleError)
    );
    console.log(res)
    return false;
  }
  /*
  listen event socket part
   */

  socketOnOpen(event) {
    this.webrtcUtilService.socket.send(JSON.stringify({
      "eventName": "__join",
      "data": {
        "room_id": this.webrtcUtilService.room_id,
        "username": this.webrtcUtilService.username,
        "name": this.webrtcUtilService.name,
      }
    }))
  }

  socketOnClose(event) {
    this.clear();
  }

  socketOnError(event) {
    this.webrtcUtilService.emit("error", '与服务器的连接存在问题');
  }

  socketOnMessage(event) {
    let res = JSON.parse(event.data);
    let eventName = res.eventName;
    let data = res.data;

    //对服务器发过来的数据进行分类处理
    switch (eventName) {
      case "_peers":
        this.handle_peersEvent(data);
        break;
      case "_ice_candidate":
        this.handle_ice_candidateEvent(data);
        break;
      case "_new_peer":
        this.handle_new_peerEvent(data);
        break;
      case "_remove_peer":
        this.handle_remove_peerEvent(data);
        break;
      case "_offer":
        this.handle_offerEvent(data);
        break;
      case "_answer":
        this.handle_answerEvent(data);
        break;
      case "_repeatedName":
        this.handle_repeatedNameEvent(data);
        break;
      default:
        // @ts-ignore
        this.emit("socket_receive_message", this.webrtcUtilService.socket, res);
    }
  }

  /*
  对服务器发送的信息进行处理的部分
   */
  handle_peersEvent(data) {
    this.peerConnectionService.handle_peersEvent(data);
    this.webrtcUtilService.socket_id = data.socketId;
    // @ts-ignore
    that.emit('connected', data.clientsInfo, data.you);
  }

  handle_ice_candidateEvent(data) {
    this.peerConnectionService.handle_ice_candidateEvent(data);
  }

  handle_new_peerEvent(data) {
    this.peerConnectionService.handle_new_peerEvent(data);
    // @ts-ignore
    that.emit("new_client_joined", data.name, data.username, data.socketId);
  }

  handle_remove_peerEvent(data) {
    let neighbour = this.neighbourService.getNeighbourBySocketId(data.socketId);
    let name = neighbour.name;
    let username = neighbour.username;

    this.peerConnectionService.handle_remove_peerEvent(data, neighbour);
    // @ts-ignore
    that.emit("remove_peer_video", name, username);
  }

  handle_offerEvent(data) {
    this.peerConnectionService.handle_offerEvent(data);
  }

  handle_answerEvent(data) {
    this.peerConnectionService.handle_answerEvent(data);
  }

  handle_repeatedNameEvent(data) {
    this.webrtcUtilService.socket.close(1000, "因为用户名重复，因此关闭socket");

    // @ts-ignore
    this.emit("repeatedName");
  }

  /*
  stream part
   */

  /*
  @input device, indicates which device is shared. camera or desktop
   */
  changeShareDevice(device: string) {

  }

  /*
  @input: videoState
  @output: boolean
   */
  changeVideoStreamState(videoState: boolean) {
    if (this.webrtcUtilService.localMediaStream !== null) {
      if (this.webrtcUtilService.localMediaStream.getVideoTracks().length > 0)
        this.webrtcUtilService.localMediaStream.getVideoTracks()[0].enabled = videoState;
    }
  }

  /*
  @input: videoState
  @output: boolean
   */
  changeAudioStreamState(audioState: boolean) {
    if (this.webrtcUtilService.localMediaStream !== null) {
      if (this.webrtcUtilService.localMediaStream.getAudioTracks().length > 0)
        this.webrtcUtilService.localMediaStream.getAudioTracks()[0].enabled = audioState;
    }
  }

  closeStream(stream: MediaStream) {
    if (stream !== null) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
  };

  /*
  util part
   */

  shareFile(file){
    this.dataChannelService.shareFile(file);
  }

  /*

   */
  clear() {
    //clear all the parts of service
    if (this.webrtcUtilService.socket && (this.webrtcUtilService.socket.readyState == 0 || this.webrtcUtilService.socket.readyState == 1))
      this.webrtcUtilService.socket.close(1000, "用户自主关闭了socket");
    this.webrtcUtilService.socket = undefined;
    this.webrtcUtilService.room_id = undefined;
    this.webrtcUtilService.username = undefined;
    this.webrtcUtilService.name = undefined;
    this.webrtcUtilService.socket_id = undefined;
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

  private static handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }
}

