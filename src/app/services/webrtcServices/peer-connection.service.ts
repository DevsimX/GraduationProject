import {Injectable} from '@angular/core';
import {Neighbour, NeighboursService} from "./neighbours.service";
import {ConstantService} from "../constant.service";
import {LoggerService} from "./logger.service";
import {DataChannelService} from "./data-channel.service";
import {WebrtcUtilService} from "./webrtc-util.service";

@Injectable({
  providedIn: 'root'
})
export class PeerConnectionService {
  PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

  constructor(
    private neighbourService: NeighboursService,
    private constant: ConstantService,
    private dataChannelService: DataChannelService,
    private webrtcUtilService: WebrtcUtilService,
    private logger: LoggerService,
  ) {
  }

  /*
  handle event part
   */
  handle_peersEvent(data) {
    let that = this;
    for (let i in data) {
      that.neighbourService.addNeighbour(i,
        data[i]['name'],
        data[i]['username'],
        undefined,
        undefined,
        [],
        undefined);
      that.createPeerConnection(i);
    }
  }

  handle_ice_candidateEvent(data) {
    let that = this;
    let candidate = new RTCIceCandidate(data);
    let targetNeighbour = that.neighbourService.getNeighbourBySocketId(data.socketId)
    let targetPeerConnection = targetNeighbour.peer_connection;
    if (!targetPeerConnection
      || !targetPeerConnection.remoteDescription
      || !targetPeerConnection.remoteDescription.type) {
      //push candidate onto queue...
      this.logger.log("remote not set!")
    }
    targetPeerConnection.addIceCandidate(candidate).then(r => {
      this.logger.log(targetNeighbour.socketId + " icecandidate add successfully")
    });
  }

  handle_new_peerEvent(data) {
    let that = this;
    that.neighbourService.addNeighbour(
      data.socketId,
      data.username,
      data.name,
      that.createPeerConnection(data.socketId),
      undefined,
      [],
      undefined,
    );
  }

  handle_remove_peerEvent(data, neighbour: Neighbour) {
    let that = this;

    that.webrtcUtilService.closePeerConnection(neighbour.peer_connection);

    that.webrtcUtilService.closeDataChannel(neighbour.data_channel);

    for (let sendId in neighbour.file_channel) {
      that.dataChannelService.handle_send_file_errorEvent(new Error("Connection has been closed"), data.socketId, sendId);
    }

    that.neighbourService.deleteNeighbourBySocketId(data.socketId);
  }

  handle_offerEvent(data) {
    this.receiveOffer(data.socketId, data.sdp);
  }

  handle_answerEvent(data) {
    let that = this;
    that.receiveAnswer(data.socketId, data.sdp);
  }

  handle_remoteControlFailEvent(data) {

  }

  handle_remoteControlSuccessEvent(data) {

  }

  handle_receiveRemoteControlAskEvent(data) {

  }

  /*
  util part
   */
  createPeerConnection(socketId: string): RTCPeerConnection {
    let that = this;
    // @ts-ignore
    let peerConnection = new this.PeerConnection(this.constant.iceServer);

    /*
    peer connection event part
     */
    peerConnection.onicecandidate = function (evt) {
      console.log(evt)
      //如果peer connection要和其他的peer connection通信就会触发这个函数
      // Send the candidate to the remote peer
      if (evt.candidate) {
        that.webrtcUtilService.socket.emit('_ice_candidate',
            {
              "id": evt.candidate.sdpMid,
              "label": evt.candidate.sdpMLineIndex,
              "sdpMLineIndex": evt.candidate.sdpMLineIndex,
              "candidate": evt.candidate.candidate,
              "socketId": socketId,
            }
          )
      } else {
        // All ICE candidates have been sent
      }
    };

    peerConnection.oniceconnectionstatechange = function (evt) {
      if (peerConnection.iceConnectionState === "failed" ||
        peerConnection.iceConnectionState === "disconnected" ||
        peerConnection.iceConnectionState === "closed") {
        // Handle the failure
      }
    }

    peerConnection.onicegatheringstatechange = function (evt) {
      switch (peerConnection.iceGatheringState) {
        case "new":
        case "complete":
          that.logger.log("Idle")
          break;
        case "gathering":
          that.logger.log("Determining route");
          break;
      }
    }

    //只要peerConnection接收到了一个track就会调用这个函数，但往往一个通信过程会发送两个track过来
    peerConnection.ontrack = function (evt) {
      that.neighbourService.addTrackToNeighbour(socketId, evt.track)
    };

    /*
    @input: event.channel is the created data channel
   */
    peerConnection.ondatachannel = function (evt) {
      that.dataChannelService.bindEventsToDataChannel(socketId, evt.channel);
    };

    peerConnection.onconnectionstatechange = function (event) {
      switch (peerConnection.connectionState) {
        case "connected":
          // The connection has become fully connected
          break;
        case "disconnected":
        case "failed":
          // One or more transports has terminated unexpectedly or in an error
          break;
        case "closed":
          // The connection has been closed
          break;
      }
      that.logger.log("connectionstate为：" + peerConnection.connectionState);
    }

    peerConnection.onsignalingstatechange = function (event) {
      that.logger.log("signalingstate为：" + peerConnection.signalingState);
    }

    //peerConnection添加了add track之后，浏览器会启动negotiationneeded，调用这个函数，意思是你已经准备好了，可以准备连接了
    //我这里默认只有视频流创建之后才会进行sendoffer的操作。
    peerConnection.onnegotiationneeded = function () {
      //send offer
      try {
        that.logger.log("---> Creating offer");
        if (peerConnection.signalingState !== "stable") {
          that.logger.log("     -- The connection isn't stable yet; postponing...")
          return;
        }
        peerConnection.createOffer().then(function (offer) {
          return peerConnection.setLocalDescription(offer);
        })
          .then(function () {
            that.webrtcUtilService.socket.emit('_offer',
              {
                  "sdp": peerConnection.localDescription,
                  "socketId": socketId,
                }
              )
          })
      } catch (err) {
        that.logger.log("*** The following error occurred while handling the negotiationneeded event:");
        that.logger.log_error(err);
      }
    }
    return peerConnection;
  }

  receiveOffer(socketId, sdp) {
    this.logger.log("---> Receive offer")
    this.sendAnswer(socketId, sdp);
    this.logger.log("---> Send Answer")
  };

  receiveAnswer(socketId, sdp) {
    this.logger.log("---> Receive answer")
    let peerConnection = this.neighbourService.getNeighbourBySocketId(socketId).peer_connection;
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(function () {
      //TODO
    });
  };

  sendAnswer(socketId, sdp) {
    let peerConnection = this.neighbourService.getNeighbourBySocketId(socketId).peer_connection;
    let that = this;
    try {
      peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
        .then(function () {
          if (peerConnection.getSenders() !== null && peerConnection.getSenders().length > 0)
            peerConnection.getSenders().forEach(sender => peerConnection.removeTrack(sender));
          that.webrtcUtilService.localMediaStream.getTracks().forEach(track => peerConnection.addTrack(track));
        })
        .then(function () {
          return peerConnection.createAnswer();
        })
        .then(function (answer) {
          return peerConnection.setLocalDescription(answer);
        })
        .then(function () {
          that.webrtcUtilService.socket.emit('_answer',{
              "socketId": socketId,
              "sdp": peerConnection.localDescription,
            });
        })
    } catch (err) {
      that.logger.log("*** The following error occurred while handling the sendAnswer event:");
      that.logger.log_error(err);
    }
  };
}
