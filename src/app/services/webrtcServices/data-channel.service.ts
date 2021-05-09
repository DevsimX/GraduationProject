import {Injectable, NgZone} from '@angular/core';
import {LoggerService} from "./logger.service";
import {NeighboursService} from "./neighbours.service";
import {WebrtcService} from "./webrtc.service";
import {ConstantService} from "../constant.service";
import {WebrtcUtilService} from "./webrtc-util.service";

/*
interface part
 */

interface receiveFilesType {
  socketId: string,
  state: string,
  name: string,
  size: number
}

@Injectable({
  providedIn: 'root'
})
export class DataChannelService {

  constructor(
    private logger: LoggerService,
    private webrtcUtilService: WebrtcUtilService,
    private neighbourService: NeighboursService,
    private constant: ConstantService,
    private zone: NgZone,
  ) {
  }

  //为Data channel绑定相应的事件回调函数
  bindEventsToDataChannel(socketId: string, channel: RTCDataChannel) {
    let that = this;
    let neighbour = that.neighbourService.getNeighbourBySocketId(socketId);
    channel.onopen = function () {
      that.logger.log('data_channel_opened')
    };

    channel.onclose = function (event) {
      neighbour.data_channel = undefined;
      that.logger.log('data_channel_closed');
    };

    channel.onmessage = function (message) {
      let json = JSON.parse(message.data);
      let neighbour = that.neighbourService.getNeighbourBySocketId(socketId);

      if (json.type === '__file') {
        /*that.receiveFileChunk(json);*/
        that.parseFilePacket(json, socketId);
      } else if (json.type === '__chatMessage') {
        that.zone.run(
          () => that.webrtcUtilService.chatMessages.push({
            name: neighbour.name,
            time: json.time,
            message: json.data,
          })
        )
        that.webrtcUtilService.unreadChatMessageNum++;
      }


    };

    channel.onerror = function (err) {
      that.logger.log('data_channel_error: ' + err)
    };

    neighbour.data_channel = channel;
  }

  //为某一个peer connection添加data channel
  createDataChannel(socketId: string, peerConnection: RTCPeerConnection,label){
    let channel;
    try {
      channel = peerConnection.createDataChannel(label);
    } catch (error) {
      //TODO
      this.logger.log_error(error);
    }

    this.bindEventsToDataChannel(socketId,channel);
    return channel;
  }

  /*
  file handle part
   */
  parseFilePacket(json, socketId) {
    let signal = json.signal,
      that = this;
    if (signal === 'ask') {
      that.receiveFileAsk(json.sendId, json.name, json.size, socketId);
    } else if (signal === 'accept') {
      that.receiveFileAccept(json.sendId, socketId);
    } else if (signal === 'refuse') {
      that.receiveFileRefuse(json.sendId, socketId);
    } else if (signal === 'chunk') {
      that.receiveFileChunk(json.data, json.sendId, socketId, json.last, json.percent);
    } else if (signal === 'close') {
      //TODO
    }
  };


  /*
  send file part
   */
  shareFile(file) {
    //广播文件
    let that = this;
    for (let neighbour of that.neighbourService.neighbours) {
      that.sendFile(file, neighbour.socketId)
    }
    // @ts-ignore
    that.webrtcService.emit("file_sent");
  };

  sendFile(file, socketId) {
    //向某一单个用户发送文件
    let that = this,
      // file,
      reader,
      fileToSend,
      sendId;
    // if (typeof dom === 'string') {
    //     dom = document.getElementById(dom);
    // }
    // if (!dom) {
    //     that.handle_send_file_errorEvent( new Error("Can not find dom while sending file"), socketId);
    //     return;
    // }
    // if (!dom.files || !dom.files[0]) {
    //     that.handle_send_file_errorEvent( new Error("No file need to be sended"), socketId);
    //     return;
    // }
    // file = dom.files[0];
    let neighbour = that.neighbourService.getNeighbourBySocketId(socketId);
    let fileChannel = neighbour.file_channel;
    sendId = that.getRandomString();
    fileToSend = {
      file: file,
      state: "ask"
    };
    fileChannel[sendId] = fileToSend;
    that.sendAsk(socketId, sendId, fileToSend);
  };

  //发送多个文件的碎片
  sendFileChunks() {
    let sendId,
      that = this,
      nextTick = false;
    for (let neighbour of that.neighbourService.neighbours) {
      for (sendId in neighbour.file_channel) {
        if (neighbour.file_channel[sendId].state === "send") {
          nextTick = true;
          that.sendFileChunk(neighbour.socketId, sendId);
        }
      }
    }
    if (nextTick) {
      setTimeout(function () {
        that.sendFileChunks();
      }, 10);
    }
  };

  //发送某个文件的碎片
  sendFileChunk(socketId, sendId) {
    let that = this,
      neighbour = that.neighbourService.getNeighbourBySocketId(socketId),
      fileToSend = neighbour.file_channel[sendId],
      packet = {
        type: "__file",
        signal: "chunk",
        sendId: sendId,
        last: undefined,
        data: undefined,
        percent: undefined,
      },
      channel;

    fileToSend.sendedPackets++;
    fileToSend.packetsToSend--;


    if (fileToSend.fileData.length > that.constant.packetSize) {
      packet.last = false;
      packet.data = fileToSend.fileData.slice(0, that.constant.packetSize);
      packet.percent = fileToSend.sendedPackets / fileToSend.allPackets * 100;
      // that.emit("send_file_chunk", sendId, socketId, fileToSend.sendedPackets / fileToSend.allPackets * 100, fileToSend.file);
    } else {
      packet.data = fileToSend.fileData;
      packet.last = true;
      fileToSend.state = "end";
      // that.emit("sent_file", sendId, socketId, fileToSend.file);
      that.cleanSendFile(sendId, socketId);
    }

    channel = neighbour.data_channel;

    if (!channel) {
      that.handle_send_file_errorEvent(new Error("Channel has been destroyed"), socketId, sendId);
      return;
    }
    channel.send(JSON.stringify(packet));
    fileToSend.fileData = fileToSend.fileData.slice(packet.data.length);
  };

  //发送文件请求
  sendAsk(socketId, sendId, fileToSend) {
    let that = this,
      neighbour = that.neighbourService.getNeighbourBySocketId(socketId),
      channel = neighbour.data_channel,
      packet;
    if (!channel) {
      that.handle_send_file_errorEvent(new Error("Channel has been closed"), socketId, sendId);
    }
    packet = {
      name: fileToSend.file.name,
      size: fileToSend.file.size,
      sendId: sendId,
      type: "__file",
      signal: "ask"
    };
    channel.send(JSON.stringify(packet));
  };

  //发送文件请求后若对方同意接受,开始传输
  receiveFileAccept(sendId, socketId) {
    let that = this,
      fileToSend,
      neighbour = that.neighbourService.getNeighbourBySocketId(socketId),
      reader,
      initSending = function (event, text) {
        fileToSend.state = "send";
        fileToSend.fileData = event.target.result;
        fileToSend.sendedPackets = 0;
        fileToSend.packetsToSend = fileToSend.allPackets = Math.ceil(fileToSend.fileData.length / that.constant.packetSize);
        that.sendFileChunks();
      };
    fileToSend = neighbour.file_channel[sendId];
    reader = new window.FileReader();
    reader.readAsDataURL(fileToSend.file);
    reader.onload = initSending;
    // that.emit("send_file_accepted", sendId, socketId, that.fileChannels[socketId][sendId].file);
  };

  //发送文件请求后若对方拒绝接受,清除掉本地的文件信息
  receiveFileRefuse(sendId, socketId) {
    let that = this,
      neighbour = that.neighbourService.getNeighbourBySocketId(socketId);
    neighbour.file_channel[sendId].state = "refused";
    // that.emit("send_file_refused", sendId, socketId, that.fileChannels[socketId][sendId].file);
    that.cleanSendFile(sendId, socketId);
  };

  /*
  receive file part
   */

  //获得随机字符串来生成文件发送ID
  getRandomString(): string {
    return (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
  };

  /***********************接收者部分***********************/


  //接收到文件碎片
  receiveFileChunk(data, sendId, socketId, last, percent) {
    let that = this,
      fileInfo = that.webrtcUtilService.receiveFiles[sendId];
    if (!fileInfo.data) {
      fileInfo.state = "receive";
      fileInfo.data = "";
    }
    fileInfo.data = fileInfo.data || "";
    fileInfo.data += data;
    if (last) {
      fileInfo.state = "end";
      that.getTransferredFile(sendId);
    } else {
      // @ts-ignore
      that.webrtcService.emit("receive_file_chunk", sendId, socketId, fileInfo.name, percent);
    }
  };

  //接收到所有文件碎片后将其组合成一个完整的文件并自动下载
  getTransferredFile(sendId) {
    let that = this,
      fileInfo = that.webrtcUtilService.receiveFiles[sendId],
      hyperlink = document.createElement("a"),
      mouseEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
    hyperlink.href = fileInfo.data;
    hyperlink.target = '_blank';
    hyperlink.download = fileInfo.name;

    hyperlink.dispatchEvent(mouseEvent);
    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
    // that.emit("receive_file", sendId, fileInfo.socketId, fileInfo.name);
    that.cleanReceiveFile(sendId);
  };

  //接收到发送文件请求后记录文件信息
  receiveFileAsk(sendId, fileName, fileSize, socketId) {
    let that = this;
    that.webrtcUtilService.receiveFiles[sendId] = {
      socketId: socketId,
      state: "ask",
      name: fileName,
      size: fileSize
    };

    // @ts-ignore
    that.webrtcService.emit("receive_file_ask", sendId, socketId, fileName, fileSize);
  };

  //发送同意接收文件信令
  acceptSentFile(sendId) {
    let that = this,
      fileInfo = that.webrtcUtilService.receiveFiles[sendId],
      neighbour = that.neighbourService.getNeighbourBySocketId(fileInfo.socketId),
      channel = neighbour.data_channel,
      packet;
    if (!channel) {
      that.handle_receive_file_errorEvent(new Error("Channel has been destoried"), sendId);
    }
    packet = {
      type: "__file",
      signal: "accept",
      sendId: sendId
    };
    channel.send(JSON.stringify(packet));
  };

  //发送拒绝接受文件信令
  refuseSentFile(sendId) {
    let that = this,
      fileInfo = that.webrtcUtilService.receiveFiles[sendId],
      neighbour = that.neighbourService.getNeighbourBySocketId(fileInfo.socketId),
      channel = neighbour.data_channel,
      packet;
    if (!channel) {
      that.handle_receive_file_errorEvent(new Error("Channel has been destoried"), sendId);
    }
    packet = {
      type: "__file",
      signal: "refuse",
      sendId: sendId
    };
    channel.send(JSON.stringify(packet));
    that.cleanReceiveFile(sendId);
  };

  /*
  file util part
   */

  //文件处理
  handle_send_file_errorEvent(error, socketId, sendId) {
    let that = this;
    that.cleanSendFile(sendId, socketId);
  }

  handle_receive_file_errorEvent(error, sendId) {
    let that = this;
    that.cleanReceiveFile(sendId);
  }

  //清除发送文件缓存
  cleanSendFile(sendId, socketId) {
    let that = this;
    let neighbour = that.neighbourService.getNeighbourBySocketId(socketId);
    delete neighbour.file_channel[sendId];
  };

  //清除接受文件缓存
  cleanReceiveFile(sendId) {
    let that = this;
    delete that.webrtcUtilService.receiveFiles[sendId];
  };
}
