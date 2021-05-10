export var SkyRTC = function () {

  //创建本地流
  let gThat;
  let dThat;
  //考虑到兼容性的peerconnection的声明方法
  let PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
  //考虑到兼容性的声明方法
  let getUserMedia = (navigator.getUserMedia ||//旧版API
    navigator.mediaDevices.getUserMedia ||//最新的标准API
    navigator.webkitGetUserMedia ||  //webkit核心浏览器
    navigator.mozGetUserMedia ||     //firfox浏览器
    navigator.msGetUserMedia
  );
  let nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
  let nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription);


  //ice服务器，有必要的话可以自己搭建一个
  const iceServer = {
    "iceServers": [
      {
        "url": "stun:stun.l.google.com:19302"
      },
      {
        "url": "stun:global.stun.twilio.com:3478"
      },
      {
        "url": "turn:global.stun.twilio.com:3478",
        "username": "79fdd6b3c57147c5cc44944344c69d85624b63ec30624b8674ddc67b145e3f3c",
        "credential": "xjfTOLkVmDtvFDrDKvpacXU7YofAwPg6P6TXKiztVGw"
      }
    ]
  };
  let packetSize = 1000;


  /***********************************************************/
  /*             各种函数                                     */

  /**********************************************************/
  function log(text) {
    var time = new Date();

    console.log("[" + time.toLocaleTimeString() + "] " + text);
  }

  function log_error(text) {
    var time = new Date();

    console.trace("[" + time.toLocaleTimeString() + "] " + text);
  }

  //neighbour对象，和用户相邻的client
  function Neighbour(socketId, name, username, peerConnection, dataChannel, fileChannel) {
    this.socketId = socketId;
    this.name = name;
    this.username = username;
    this.peerConnection = peerConnection;
    this.dataChannel = dataChannel;
    this.fileChannel = fileChannel;
  }

  // Handles reporting errors. Currently, we just dump stuff to console but
  // in a real-world application, an appropriate (and user-friendly)
  // error message should be displayed.

  function reportError(errMessage) {
    log_error(`Error ${errMessage.name}: ${errMessage.message}`);
  }


  /*************************流处理部分*******************************/
  //访问用户媒体设备的兼容方法
  function getUserMediaFun(constraints, success, error) {
    if (navigator.mediaDevices.getUserMedia) {
      //最新的标准API
      navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
    } else if (navigator.webkitGetUserMedia) {
      //webkit核心浏览器
      navigator.webkitGetUserMedia(constraints, success, error)
    } else if (navigator.mozGetUserMedia) {
      //firfox浏览器
      navigator.mozGetUserMedia(constraints, success, error);
    } else if (navigator.getUserMedia) {
      //旧版API
      navigator.getUserMedia(constraints, success, error);
    } else {
      gThat.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
    }
  }

  /**********************************************************/
  /*             事件处理器，类似于socket.io的emit方法           */

  /**********************************************************/
  function EventEmitter() {
    this.events = {};
  }

  //绑定事件函数
  EventEmitter.prototype.on = function (eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  };
  //触发事件函数
  EventEmitter.prototype.emit = function (eventName, _) {
    var events = this.events[eventName],
      args = Array.prototype.slice.call(arguments, 1),
      i, m;

    if (!events) {
      return;
    }
    for (i = 0, m = events.length; i < m; i++) {
      events[i].apply(null, args);
    }
  };


  /**********************************************************/
  /*                   流及信道建立部分                       */

  /**********************************************************/


  /*******************基础部分*********************/
  function skyrtc() {
    //本地media stream
    this.localMediaStream = null;
    //所在房间
    this.room = "";
    //接收文件时用于暂存接收文件
    this.fileData = {};
    //本地WebSocket连接
    this.webSocket = null;
    //本地socket的id，由后台服务器创建
    this.mySocketId = null;
    //用户名，用来唯一标识client
    this.username = null;
    //姓名，用于前端显示
    this.name = null;
    //邻居的列表
    this.neighbourList = [];
    //初始时需要构建链接的数目
    this.numStreams = 0;
    //初始时已经连接的数目
    this.initializedStreams = 0;
    //保存所有接受到的文件
    this.receiveFiles = {};
    //远程连接的信息，peerconnection，role，stream，remote socket id
    this.remoteControlInfo = {
      peerConnection: undefined,
      role: undefined,
      stream: undefined,
      remoteSocketId: undefined,
    };
  }

  //继承自事件处理器，提供绑定事件和触发事件的功能
  skyrtc.prototype = new EventEmitter();


  /**********************************************************/
  /*                   服务器连接部分                         */
  /**********************************************************/

  skyrtc.prototype.connect = function (server, room, username, name) {
    //that的声明是为了避免异步时会出现问题
    this.username = username;
    this.name = name;
    var socket,
      that = this;
    socket = this.socket = new WebSocket(server);


    /*************************websocket自带的监听函数*******************************/
    socket.onopen = function () {
      socket.send(JSON.stringify({
        "eventName": "__join",
        "data": {
          "room_id": room,
          "username": username,
          "name": name,
        }
      }));
      that.emit("socket_opened", socket);
    };

    socket.onmessage = function (message) {
      var json = JSON.parse(message.data);
      let eventName = json.eventName;
      let data = json.data;
      //对服务器发过来的数据进行分类处理
      switch (eventName) {
        case "_peers":
          that.handle_peersEvent(data);
          break;
        case "_ice_candidate":
          that.handle_ice_candidateEvent(data);
          break;
        case "_remote_ice_candidate":
          that.handle_remote_ice_candidateEvent(data);
          break;
        case "_new_peer":
          that.handle_new_peerEvent(data);
          break;
        case "_remove_peer":
          that.handle_remove_peerEvent(data);
          break;
        case "_offer":
          that.handle_offerEvent(data);
          break;
        case "_answer":
          that.handle_answerEvent(data);
          break;
        case "_repeatedName":
          that.handle_repeatedNameEvent(data);
          break;
        case "_remoteControlFail":
          that.handle_remoteControlFailEvent(data);
          break;
        case "_remoteControlSuccess":
          that.handle_remoteControlSuccessEvent(data);
          break;
        case "_receiveRemoteControlAsk":
          that.handle_receiveRemoteControlAskEvent(data)
          break;
        default:
          that.emit("socket_receive_message", socket, json);
      }
    };

    socket.onerror = function (error) {
      that.emit("error", '与服务器的连接存在问题');
    };

    socket.onclose = function (event) {
      that.closeStream(that.localMediaStream);
      for(let neighbour of that.neighbourList){
        that.closePeerConnection(neighbour.peerConnection);
      }
      that.neighbourList = [];
      that.fileData = {};
      that.socket = null;
    };
  };

  //根据socketId查询内容
  skyrtc.prototype.getInfoBySocketId = function (socketId,info) {
    let that = this;
    let res;
    for(let neighbour of that.neighbourList){
      if(socketId === neighbour.socketId){
        res = neighbour;
      }
    }

    switch (info) {
      case 'name': return res.name;
      case 'username': return res.username;
      case 'peerConnection': return res.peerConnection;
      case 'dataChannel': return res.dataChannel;
      case 'fileChannel': return res.fileChannel;
      case 'all': return res;
      default: return null;
    }
  }

  //根据socketId查询内容
  skyrtc.prototype.deleteNeighbourBySocketId = function (socketId) {
    let that = this;
    for(let i = 0 ; i < that.neighbourList.length ; i++){
      if(socketId === that.neighbourList[i].socketId){
        that.neighbourList.splice(i,1);
      }
    }
  }


  /*************************对服务器发送过来的消息进行处理的部分*******************************/
  //创建socket id，告知与自己在同一个房间的所有socket id
  skyrtc.prototype.handle_peersEvent = function (data) {
    //获取所有服务器上的connections
    var that = this;
    for (let i in data.clientsInfo) {
      that.neighbourList.push(
        new Neighbour(
          i,
          data.clientsInfo[i]['name'],
          data.clientsInfo[i]['username'],
          undefined,
          undefined,
          undefined,
        ))
    }
    that.mySocketId = data.you;
    that.createPeerConnections();
    that.emit('connected', data.clientsInfo,data.you);
  }

  skyrtc.prototype.handle_ice_candidateEvent = function (data) {
    let that = this;
    var candidate = new nativeRTCIceCandidate(data);
    var pc = that.getInfoBySocketId(data.socketId,"peerConnection");
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
      //push candidate onto queue...
      log("remote not set!")
    }
    pc.addIceCandidate(candidate);
    that.emit('get_ice_candidate', candidate);
  }

  skyrtc.prototype.handle_remote_ice_candidateEvent = function (data) {
    let that = this;
    var candidate = new nativeRTCIceCandidate(data);
    var pc = that.remoteControlInfo.peerConnection;
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
      //push candidate onto queue...
      log("remote not set!")
    }
    pc.addIceCandidate(candidate);
    that.emit('get_ice_candidate', candidate);
  }

  //有新用户加入到房间中
  skyrtc.prototype.handle_new_peerEvent = function (data) {
    let that = this;
    that.neighbourList.push(
      new Neighbour(
        data.socketId,
        data.name,
        data.username,
        that.createPeerConnection(data.socketId,"normal"),
        undefined,
        undefined,
      )
    );
    that.emit("new_client_joined", data.name, data.username,data.socketId);
  }

  //房间中有用户退出
  skyrtc.prototype.handle_remove_peerEvent = function (data) {
    let that = this;
    var sendId;
    let client = that.getInfoBySocketId(data.socketId,"all");
    let name = client.name;
    let username = client.username;
    that.closePeerConnection(client.peerConnection);
    for (sendId in client.fileChannel) {
      that.handle_send_file_errorEvent(new Error("Connection has been closed"), data.socketId, sendId, client.fileChannel[sendId].file);
    }
    that.deleteNeighbourBySocketId(data.socketId);
    that.emit("remove_peer_video", name, username);
  }

  //用户名重复
  skyrtc.prototype.handle_repeatedNameEvent = function () {
    let that = this;
    that.socket.close(1000, "因为用户名重复，因此关闭socket");
    that.emit("repeatedName");
  }

  //远程连接请求失败
  skyrtc.prototype.handle_remoteControlFailEvent = function (data) {
    let that = this;
    that.emit("remote_control_fail", data.name, data.error);
  }

  //远程连接请求成功
  skyrtc.prototype.handle_remoteControlSuccessEvent = function (data) {
    let that = this;
    that.emit("remote_control_success", data.name);
  }

  //收到远程控制的连接请求
  skyrtc.prototype.handle_receiveRemoteControlAskEvent = function (data) {
    let that = this;
    that.emit("receive_remote_control_ask", data.socketId,that.getInfoBySocketId(data.socketId,'name'));
  }

  //接收offer
  skyrtc.prototype.handle_offerEvent = function (data) {
    let that = this;
    that.receiveOffer(data.socketId, data.sdp,data.role);
    that.emit("get_offer", data);
  }

  //接收answer
  skyrtc.prototype.handle_answerEvent = function (data) {
    let that = this;
    that.receiveAnswer(data.socketId, data.sdp, data.role);
    that.emit('get_answer', data);
  }

  //创建流成功之后，pc添加track，触发onnegotiated函数，发送offer
  skyrtc.prototype.handle_readyEvent = function () {
    let that = this;
    that.addDataChannels();
    for(let neighbour of that.neighbourList){
      if (that.localMediaStream !== null)
        that.localMediaStream
          .getTracks()
          .forEach(track => neighbour.peerConnection.addTrack(track));
    }
  }


  //文件处理
  skyrtc.prototype.handle_send_file_errorEvent = function (error, socketId, sendId) {
    let that = this;
    that.cleanSendFile(sendId, socketId);
  }

  skyrtc.prototype.handle_receive_file_errorEvent = function (error, sendId) {
    let that = this;
    that.cleanReceiveFile(sendId);
  }

  //与选中的用户进行连接请求
  skyrtc.prototype.askRemoteControl = function (controlledSocketId) {
    let that = this;
    that.remoteControlInfo.stream = new MediaStream();
    that.remoteControlInfo.role = "controller";
    that.remoteControlInfo.peerConnection = that.createPeerConnection(controlledSocketId,'remote');
    that.remoteControlInfo.remoteSocketId = controlledSocketId;
    that.socket.send(JSON.stringify({
      "eventName": "__remoteControlAsk",
      "data": {
        "controlled": controlledSocketId,
      }
    }));
  };

  //远程控制连接请求的处理
  skyrtc.prototype.handleRemoteControlRequest = function (controllerSocketId, state, info) {
    let that = this;
    that.socket.send(JSON.stringify({
      "eventName": "__remoteControlRespond",
      "data": {
        "controller": controllerSocketId,
        "state": state,
        "info": info,
      }
    }));
  }

  //远程控制连接请求的处理
  skyrtc.prototype.getDesktopTrack = function (controllerSocketId) {
    let that = this;
    navigator.mediaDevices.getDisplayMedia({
      video: true, audio: false
    })
      .then(function (stream) {
        that.remoteControlInfo.remoteSocketId = controllerSocketId;
        that.remoteControlInfo.role = 'controlled';
        that.remoteControlInfo.stream = stream;
        that.remoteControlInfo.peerConnection = that.createPeerConnection(controllerSocketId,"remote");
        that.remoteControlInfo.peerConnection.addTrack(stream.getVideoTracks()[0])
      })
      .catch(function (error) {
        that.emit("error", error);
        that.handleRemoteControlRequest(controllerSocketId, "refuse",  "目标用户无法与你建立远程连接");
      });
  }

  /*************************桌面共享*******************************/
  skyrtc.prototype.shareDeviceChange = function (state) {
    dThat = this;
    if (state === 'shareDesktop')
      navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
        .then(getDesktopStreamSuccessfully)
        .catch(getDesktopStreamError);
    else {
      let options = {
        "video": true,
        "audio": true
      };
      if (getUserMedia) {
        getUserMediaFun(options, getDesktopStreamSuccessfully, createStreamError)
      }
    }
  };

  function getDesktopStreamError(err) {
    console.error('屏幕共享失败!', err);
  }

  function getDesktopStreamSuccessfully(stream) {
    dThat.emit("stream_reset", stream);
    for(let neighbour of dThat.neighbourList){
      let pc = neighbour.peerConnection;
      let senders = pc.getSenders();
      senders.forEach(sender => pc.removeTrack(sender));
      stream.getTracks()
        .forEach(track => pc.addTrack(track));
    }
  }


  /*************************摄像头开启*******************************/
  skyrtc.prototype.createStream = function (options) {
    var that = this;
    gThat = this;
    options.video = !!options.video;
    options.audio = !!options.audio;

    if (getUserMedia) {
      this.numStreams++;
      // 调用用户媒体设备, 访问摄像头
      getUserMediaFun(options, createStreamSuccess, createStreamError);
    } else {
      that.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
    }
  };

  function createStreamSuccess(stream) {
    if (gThat) {
      gThat.localMediaStream = stream;
      gThat.initializedStreams++;
      gThat.emit("stream_created", stream);
      if (gThat.initializedStreams === gThat.numStreams) {
        gThat.handle_readyEvent();
      }
    }
  }

  function createStreamError(error) {
    if (gThat) {
      gThat.socket.close(1000, "流创建失败");
      gThat.emit("stream_create_error", error);
    }
  }


  /*************************close部分*******************************/
  //用户自主离开服务器
  skyrtc.prototype.closeConnectionWithServer = function () {
    var that = this;
    that.socket.close(1000, "用户自主关闭了socket");
    that.emit("close_connection_successfully")
  };


  // 关闭流的所有轨道
  skyrtc.prototype.closeStream = function (stream) {
    if (stream !== null) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
  };


  /***********************信令交换部分*******************************/
  //向所有PeerConnection发送Offer类型信令
  skyrtc.prototype.sendOffers = function () {
    var i, m,
      pc,
      that = this,
      pcCreateOfferCbGen = function (pc, socketId) {
        return function (session_desc) {
          pc.setLocalDescription(session_desc);
          that.socket.send(JSON.stringify({
            "eventName": "__offer",
            "data": {
              "sdp": session_desc,
              "socketId": socketId
            }
          }));
          log(pc.signalingState);
        };
      },
      pcCreateOfferErrorCb = function (error) {
        log(error);
      };
    for(let neighbour of that.neighbourList){
      neighbour.peerConnection.createOffer(pcCreateOfferCbGen(pc, neighbour.socketId), pcCreateOfferErrorCb);
    }
  };

  //接收到Offer类型信令后作为回应返回answer类型信令
  skyrtc.prototype.receiveOffer = function (socketId, sdp, role) {
    log("---> Receive offer")
    this.sendAnswer(socketId, sdp, role);
    log("---> Send Answer")
  };

  //发送answer类型信令
  skyrtc.prototype.sendAnswer = function (socketId, sdp, role) {
    var pc = role === 'remote' ? this.remoteControlInfo.peerConnection : this.getInfoBySocketId(socketId,"peerConnection");
    var that = this;
    try {
      pc.setRemoteDescription(new nativeRTCSessionDescription(sdp))
        .then(function () {
          if (pc.getSenders() !== null && pc.getSenders().length > 0)
            pc.getSenders().forEach(sender => pc.removeTrack(sender));
          that.localMediaStream.getTracks().forEach(track => pc.addTrack(track));
        })
        .then(function () {
          return pc.createAnswer();
        })
        .then(function (answer) {
          return pc.setLocalDescription(answer);
        })
        .then(function () {
          that.socket.send(JSON.stringify({
            "eventName": "__answer",
            "data": {
              "socketId": socketId,
              "sdp": pc.localDescription,
              "role": role,
            }
          }));
        })
    } catch (err) {
      log("*** The following error occurred while handling the sendAnswer event:");
      reportError(err);
    }
  };

  //接收到answer类型信令后将对方的session描述写入PeerConnection中
  skyrtc.prototype.receiveAnswer = function (socketId, sdp, role) {
    log("---> Receive answer")
    let peerConnection = role === 'remote' ? this.remoteControlInfo.peerConnection : this.getInfoBySocketId(socketId,'peerConnection');
    peerConnection.setRemoteDescription(new nativeRTCSessionDescription(sdp));
  };


  /***********************点对点连接部分*****************************/
  //创建与其他用户连接的PeerConnections
  skyrtc.prototype.createPeerConnections = function () {
    for(let neighbour of this.neighbourList){
      neighbour.peerConnection = this.createPeerConnection(neighbour.socketId,"normal");
    }
  };

  //创建单个PeerConnection，role用于区分是视频流还是远程控制的peerConnection
  skyrtc.prototype.createPeerConnection = function (socketId,role) {
    var that = this;
    var pc = new PeerConnection(iceServer);
    //如果peerconnection要和其他的peerconnection通信就会触发这个函数
    pc.onicecandidate = function (evt) {
      if (evt.candidate)
        that.socket.send(JSON.stringify({
          "eventName": "__ice_candidate",
          "data": {
            "id": evt.candidate.sdpMid,
            "label": evt.candidate.sdpMLineIndex,
            "sdpMLineIndex": evt.candidate.sdpMLineIndex,
            "candidate": evt.candidate.candidate,
            "socketId": socketId,
            "role": role,
          }
        }));
      // that.emit("pc_get_ice_candidate", evt.candidate, socketId, pc);
    };

    pc.onopen = function () {
      that.emit("pc_opened", socketId, pc);
    };
    //只要pc接收到了一个track就会调用这个函数，但往往一个通信过程会发送两个track过来
    pc.ontrack = function (evt) {
      if(role === 'remote'){
        console.log(evt);
        // that.remoteControlInfo.stream.addTrack(evt.track);
        // that.emit('get_remote_control_stream',that.remoteControlInfo.stream);
      }else if(role === 'normal'){
        that.emit('pc_add_track', evt.track, socketId, pc);
      }
    };

    pc.ondatachannel = function (evt) {
      that.addDataChannel(socketId, evt.channel);
      that.emit('pc_add_data_channel', evt.channel, socketId, pc);
    };

    pc.onconnectionstatechange = function (event) {
      log("当前的connectionstate为：" + pc.connectionState);
    }

    pc.onsignalingstatechange = function (event) {
      log("当前的signalingstate为：" + pc.signalingState);
    }

    //pc添加了add track之后，浏览器会启动negotiationneeded，调用这个函数，意思是你已经准备好了，可以准备连接了
    //我这里默认只有视频流创建之后才会进行sendoffer的操作。
    pc.onnegotiationneeded = function () {
      //send offer
      try {
        log("---> Creating offer");
        if (pc.signalingState !== "stable") {
          log("     -- The connection isn't stable yet; postponing...")
          return;
        }
        pc.createOffer().then(function (offer) {
          return pc.setLocalDescription(offer);
        })
          .then(function () {
            that.socket.send(JSON.stringify({
              "eventName": "__offer",
              "data": {
                "sdp": pc.localDescription,
                "socketId": socketId,
                "role": role,
              }
            }));
          })
      } catch (err) {
        log("*** The following error occurred while handling the negotiationneeded event:");
        reportError(err);
      }
    }
    return pc;
  };

  //关闭PeerConnection连接
  skyrtc.prototype.closePeerConnection = function (pc) {
    if (!pc) return;
    pc.close();
  };


  /*************************音频、视频的关闭和开启*******************************/
  //静音/播放视频轨道
  skyrtc.prototype.changeVideoTrackMuted = function (state) {
    let that = this;
    if (that.localMediaStream !== null) {
      if (that.localMediaStream.getVideoTracks().length > 0)
        that.localMediaStream.getVideoTracks()[0].enabled = state;
    }
  };

  //静音/播放音频轨道
  skyrtc.prototype.changeAudioTrackMuted = function (state) {
    let that = this;
    if (that.localMediaStream !== null) {
      if (that.localMediaStream.getAudioTracks().length > 0)
        that.localMediaStream.getAudioTracks()[0].enabled = state;
    }
  };


  /***********************数据通道连接部分*****************************/
  //消息广播
  skyrtc.prototype.broadcast = function (message, time) {
    for(let neighbour of this.neighbourList){
      this.sendMessage(message, time, neighbour.socketId);
    }
  };

  //发送消息方法
  skyrtc.prototype.sendMessage = function (message, time, socketId) {
    let sendData = message.type === "canvas" ? message : {
      type: "__msg",
      data: message,
      time: time,
    };
    let dataChannel = this.getInfoBySocketId(socketId,'dataChannel');
    if (dataChannel.readyState.toLowerCase() === 'open') {
      dataChannel.send(JSON.stringify(sendData));
    }
  };

  //对所有的PeerConnections创建Data channel
  skyrtc.prototype.addDataChannels = function () {
    for(let neighbour of this.neighbourList){
      this.createDataChannel(neighbour.socketId,neighbour.peerConnection,neighbour.username);
    }
  };

  //对某一个PeerConnection创建Data channel
  skyrtc.prototype.createDataChannel = function (socketId,peerConnection,label) {
    var pc, channel;
    pc = peerConnection;

    if (!socketId) {
      this.emit("data_channel_create_error", socketId, new Error("attempt to create data channel without socket id"));
    }

    if (!(pc instanceof PeerConnection)) {
      this.emit("data_channel_create_error", socketId, new Error("attempt to create data channel without peerConnection"));
    }
    try {
      channel = pc.createDataChannel(label);
    } catch (error) {
      this.emit("data_channel_create_error", socketId, error);
    }

    return this.addDataChannel(socketId, channel);
  };

  //为Data channel绑定相应的事件回调函数
  skyrtc.prototype.addDataChannel = function (socketId, channel) {
    var that = this;
    channel.onopen = function () {
      that.emit('data_channel_opened', channel, socketId);
    };

    channel.onclose = function (event) {
      that.getInfoBySocketId(socketId,'all').dataChannel = undefined;
      that.emit('data_channel_closed', channel, socketId);
    };

    channel.onmessage = function (message) {
      var json;
      json = JSON.parse(message.data);
      if (json.type === '__file') {
        /*that.receiveFileChunk(json);*/
        that.parseFilePacket(json, socketId);
      } else if (json.type === 'canvas') {
        that.emit('drawing', json);
      } else {
        that.emit('data_channel_message', that.getInfoBySocketId(socketId,'name'), json.time, json.data);
      }
    };

    channel.onerror = function (err) {
      that.emit('data_channel_error', channel, socketId, err);
    };

    that.getInfoBySocketId(socketId,'all').dataChannel = channel;
    return channel;
  };


  /**********************************************************/
  /*                                                        */
  /*                       文件传输                         */
  /*                                                        */
  /**********************************************************/

  /************************公有部分************************/

  //解析Data channel上的文件类型包,来确定信令类型
  skyrtc.prototype.parseFilePacket = function (json, socketId) {
    var signal = json.signal,
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

  /***********************发送者部分***********************/


  //通过Dtata channel向房间内所有其他用户广播文件
  skyrtc.prototype.shareFile = function (file) {
    var that = this;
    for(let neighbour of that.neighbourList){
      that.sendFile(file,neighbour.socketId)
    }
    that.emit("file_send_successful");
  };

  //向某一单个用户发送文件
  skyrtc.prototype.sendFile = function (file, socketId) {
    var that = this,
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
    let fileChannel = that.getInfoBySocketId(socketId,'fileChannel');
    sendId = that.getRandomString();
    fileToSend = {
      file: file,
      state: "ask"
    };
    fileChannel[sendId] = fileToSend;
    that.sendAsk(socketId, sendId, fileToSend);
  };

  //发送多个文件的碎片
  skyrtc.prototype.sendFileChunks = function () {
    var socketId,
      sendId,
      that = this,
      nextTick = false;
    for(let neighbour of that.neighbourList){
      for(sendId in neighbour.fileChannel){
        if (neighbour.fileChannel[sendId].state === "send") {
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
  skyrtc.prototype.sendFileChunk = function (socketId, sendId) {
    var that = this,
      fileToSend = that.getInfoBySocketId(socketId,'fileChannel')[sendId],
      packet = {
        type: "__file",
        signal: "chunk",
        sendId: sendId
      },
      channel;

    fileToSend.sendedPackets++;
    fileToSend.packetsToSend--;


    if (fileToSend.fileData.length > packetSize) {
      packet.last = false;
      packet.data = fileToSend.fileData.slice(0, packetSize);
      packet.percent = fileToSend.sendedPackets / fileToSend.allPackets * 100;
      that.emit("send_file_chunk", sendId, socketId, fileToSend.sendedPackets / fileToSend.allPackets * 100, fileToSend.file);
    } else {
      packet.data = fileToSend.fileData;
      packet.last = true;
      fileToSend.state = "end";
      that.emit("sended_file", sendId, socketId, fileToSend.file);
      that.cleanSendFile(sendId, socketId);
    }

    channel = that.getInfoBySocketId(socketId,'dataChannel');

    if (!channel) {
      that.handle_send_file_errorEvent(new Error("Channel has been destoried"), socketId, sendId, fileToSend.file);
      return;
    }
    channel.send(JSON.stringify(packet));
    fileToSend.fileData = fileToSend.fileData.slice(packet.data.length);
  };

  //发送文件请求后若对方同意接受,开始传输
  skyrtc.prototype.receiveFileAccept = function (sendId, socketId) {
    var that = this,
      fileToSend,
      reader,
      initSending = function (event, text) {
        fileToSend.state = "send";
        fileToSend.fileData = event.target.result;
        fileToSend.sendedPackets = 0;
        fileToSend.packetsToSend = fileToSend.allPackets = parseInt(fileToSend.fileData.length / packetSize, 10);
        that.sendFileChunks();
      };
    fileToSend = that.getInfoBySocketId(socketId,'fileChannel')[sendId];
    reader = new window.FileReader(fileToSend.file);
    reader.readAsDataURL(fileToSend.file);
    reader.onload = initSending;
    // that.emit("send_file_accepted", sendId, socketId, that.fileChannels[socketId][sendId].file);
  };

  //发送文件请求后若对方拒绝接受,清除掉本地的文件信息
  skyrtc.prototype.receiveFileRefuse = function (sendId, socketId) {
    var that = this;
    that.getInfoBySocketId(socketId,'fileChannel')[sendId].state = "refused";
    // that.emit("send_file_refused", sendId, socketId, that.fileChannels[socketId][sendId].file);
    that.cleanSendFile(sendId, socketId);
  };

  //清除发送文件缓存
  skyrtc.prototype.cleanSendFile = function (sendId, socketId) {
    var that = this;
    delete that.getInfoBySocketId(socketId,'fileChannel')[sendId];
  };

  //发送文件请求
  skyrtc.prototype.sendAsk = function (socketId, sendId, fileToSend) {
    var that = this,
      channel = that.getInfoBySocketId(socketId,'dataChannel'),
      packet;
    if (!channel) {
      that.handle_send_file_errorEvent(new Error("Channel has been closed"), socketId, sendId, fileToSend.file);
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

  //获得随机字符串来生成文件发送ID
  skyrtc.prototype.getRandomString = function () {
    return (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
  };

  /***********************接收者部分***********************/


  //接收到文件碎片
  skyrtc.prototype.receiveFileChunk = function (data, sendId, socketId, last, percent) {
    var that = this,
      fileInfo = that.receiveFiles[sendId];
    if (!fileInfo.data) {
      fileInfo.state = "receive";
      fileInfo.data = "";
    }
    fileInfo.data = fileInfo.data || "";
    fileInfo.data += data;
    if (last) {
      fileInfo.state = "end";
      that.getTransferedFile(sendId);
    } else {
      that.emit("receive_file_chunk", sendId, socketId, fileInfo.name, percent);
    }
  };

  //接收到所有文件碎片后将其组合成一个完整的文件并自动下载
  skyrtc.prototype.getTransferedFile = function (sendId) {
    var that = this,
      fileInfo = that.receiveFiles[sendId],
      hyperlink = document.createElement("a"),
      mouseEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
    hyperlink.href = fileInfo.data;
    hyperlink.target = '_blank';
    hyperlink.download = fileInfo.name || dataURL;

    hyperlink.dispatchEvent(mouseEvent);
    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
    // that.emit("receive_file", sendId, fileInfo.socketId, fileInfo.name);
    that.cleanReceiveFile(sendId);
  };

  //接收到发送文件请求后记录文件信息
  skyrtc.prototype.receiveFileAsk = function (sendId, fileName, fileSize, socketId) {
    var that = this;
    that.receiveFiles[sendId] = {
      socketId: socketId,
      state: "ask",
      name: fileName,
      size: fileSize
    };
    that.emit("receive_file_ask", sendId, socketId, fileName, fileSize);
  };

  //发送同意接收文件信令
  skyrtc.prototype.sendFileAccept = function (sendId) {
    var that = this,
      fileInfo = that.receiveFiles[sendId],
      channel = that.getInfoBySocketId(fileInfo.socketId,'dataChannel'),
      packet;
    if (!channel) {
      that.handle_receive_file_errorEvent(new Error("Channel has been destoried"), sendId, fileInfo.socketId);
    }
    packet = {
      type: "__file",
      signal: "accept",
      sendId: sendId
    };
    channel.send(JSON.stringify(packet));
  };

  //发送拒绝接受文件信令
  skyrtc.prototype.sendFileRefuse = function (sendId) {
    var that = this,
      fileInfo = that.receiveFiles[sendId],
      channel = that.getInfoBySocketId(fileInfo.socketId,'dataChannel'),
      packet;
    if (!channel) {
      that.handle_receive_file_errorEvent(new Error("Channel has been destoried"), sendId, fileInfo.socketId);
    }
    packet = {
      type: "__file",
      signal: "refuse",
      sendId: sendId
    };
    channel.send(JSON.stringify(packet));
    that.cleanReceiveFile(sendId);
  };

  //清除接受文件缓存
  skyrtc.prototype.cleanReceiveFile = function (sendId) {
    var that = this;
    delete that.receiveFiles[sendId];
  };

  //发送canvas数据
  skyrtc.prototype.sendCanvasData = function (data) {
    var that = this;
    that.broadcast(data, '');
  };

  return new skyrtc();
};
