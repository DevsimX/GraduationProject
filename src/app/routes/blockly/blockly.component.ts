import {Component, Inject, NgZone, OnInit} from '@angular/core';

import { blockly_options } from 'src/assets/blockly/blockly_options.js';

import { Crypto } from 'src/assets/crypto/crypto';

import { SkyRTC } from 'src/assets/video/webrtc-client'
import { SceneType, SceneService, SubmitType } from '../../services/scene.service';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService, NzNotificationService } from 'ng-zorro-antd';
import { UploadFile } from 'ng-zorro-antd/upload';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import {NzModalService} from "ng-zorro-antd/modal";
import * as $ from 'jquery';

declare var Blockly: any;
declare var interpreter: any;

interface SkyRTCType {
  on?: any,
  createStream?: any,
  connections?: any,
  socket?: any,
  attachStream?: any,
  connect?: any,
  emit?: any,
}

interface ObjectsType{
  moveObject?: any,
  backgroundImg?: string
}
interface HistoryResponseType {
  msg?: string,
  data?: { history:any, scene: any }
}
interface cryptoType{
  encode?:any;
  decode?:any;
}
interface SceneResponseType {
  list?: SceneType[];
}
interface MyObjectType{
  pictures?: any[],
  x?: number,
  y?: number,
  rotation?: number,
  p?: number,
  hide?: Boolean
}

interface webrtcControl {
  connected?: Boolean,//是否已经连接到了服务器中
  mediaUsable?: Boolean,//表示媒体流是否可用
  inputRoomIDString?: string,//input控件输入的文本
  roomID?: number,//所在的房间号
  rtc?: any,//webrtc-client对象实体
  localMediaStream?: object//本地的流媒体
  mediaStreams?: any[],//所有需要展示的流媒体，数组，格式：name，stream,username
  currentDisplayMediaStreamIndex?: number,//当前展示的流媒体的索引
  videoControl?: string,//控制自己的摄像头权限,open or close
  audioControl?: string,//控制自己的音频权限,open or close
  shareValue?: string,//控制分享的设备，摄像头/屏幕/远程控制
  chatHistory?: any[],//聊天室的历史记录
  unreadChatNum?: number,//未读的聊天信息的数量
  chatMessage?: string,//发送给别人的聊天信息
  fileList?: any[],//文件上传的数组
  sharing?: boolean,//分享文件的状态
  roomCamerasVisible?: boolean,//群体摄像头所在的抽屉的开关
  remoteControlUsername?: string,//远程连接的用户的用户名
}
@Component({
  selector: 'app-blockly',
  templateUrl: './blockly.component.html',
  styles: [],
  styleUrls: ['./blockly.component.less'],
})
export class BlocklyComponent implements OnInit {
  rtc = undefined;
  webrtcControl: webrtcControl = {
    connected: false,
    mediaUsable: false,
    inputRoomIDString: "",
    roomID: undefined,
    rtc: SkyRTC(),
    localMediaStream: undefined,
    mediaStreams: [],
    currentDisplayMediaStreamIndex: undefined,
    videoControl: 'close',
    audioControl: 'close',
    shareValue: 'shareCamera',
    chatHistory: [],
    unreadChatNum: 0,
    chatMessage: '',
    fileList : [],
    sharing : false,
    roomCamerasVisible: false,
    remoteControlUsername: undefined,
  }
  tabs = [];
  chatRoomVisible = false;//聊天室抽屉的显示与否
  successDuration = 3000;//成功的notification的延时时长
  errorDuration = 3000;//失败的notification的延时时长
  selectedIndex = 0;
  workspace = undefined;
  objects: any = { moveObject: {} }; // 运行过程中的objects
  oldObjects: any = { moveObject: {} }; // 场景原objects
  cxt = undefined;
  run = false;
  cWidth = 0;
  cHeight = 0;
  h = undefined;
  levelIndex: number = 1;
  scene: SceneType = undefined;
  level: string = undefined;
  roomID: string = "";
  sceneID = undefined;
  check_way = 0;
  isVisible = false;
  isOkLoading = false;
  order = 0;
  drawerVisible = false;

  // 创建场景
  movePictures: any[][] = []; // 可移动角色图片集
  otherPictures: any[][] = []; // 其他角色图片集
  bgPictures: any[][] = []; // 背景图片角色集

  moveObjectSelectedIndex: number = -1; // 可移动角色选中者索引，用来产生唯一性
  bgSelectedIndex: number = -1;

  coordinate1: string = '';
  coordinate2: string = '';

  x1: number = 0;
  y1: number = 0;
  x2: number = 0;
  y2: number = 0;

  // 新手引导
  helpIsVisible = false;
  currentIndex = 0;
  allMsg = [
    { msg: '选择一个积木，拖动到桌面上', img: 'help1.gif' },
    { msg: '选择一个动作，拖到插槽中', img: 'help2.gif' },
    { msg: '修改数值', img: 'help3.gif' },
    { msg: '顺序', img: 'help4.gif' },
    { msg: '删除', img: 'help5.gif' },
    { msg: '热线求助：创建房间与关闭摄像头', img: 'help6-n.gif' }
  ];
  buttonMsg = '下一步';

  constructor(
    private sceneService: SceneService,
    private route: ActivatedRoute,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private zone : NgZone,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
  ) {
  }


  ngOnInit(): void {
    let crypto: cryptoType = new Crypto();
    let that = this;
    this.webrtcInit();
    this.initCanvas();
    // 先获得场景编号，然后根据当前的模式判断应该执行的内容
    this.route.params.subscribe(function(data) {
      that.sceneID = data.id;

      that.route.queryParams.subscribe((query) => {
        if (!query.order) {
          that.order = 0;
          that.normalPlay();
          that.setTitle("开始学习");
          return;
        }
        let order = crypto.decode(query.order);
        switch (order.msg) {
          case "create_scene":
            that.order = 1;
            that.createScene();
            that.setTitle("创建场景");
            that.addScenePictures();
            that.addMovePictures();
            that.addOtherPictures();
            break;
          case "load_history":
            that.order = 2;
            that.loadHistory();
            that.setTitle("继续学习");
            break;
          case "load_submit":
            that.order = 3;
            that.loadSubmit(order.submit_id);
            that.setTitle("提交内容查看");
            break;
          case "load_create":
            that.order = 4;
            that.loadCreate();
            that.setTitle("查看所创场景");
            break;
        }
      });
    });
  }

  webrtcInit(): void{
    let that = this;
    let rtc = that.webrtcControl.rtc;
    let notification = that.notification;
    let message = that.message;
    //成功创建WebSocket连接
    rtc.on("connected", function (names,usernames) {
      that.webrtcControl.inputRoomIDString = '';
      for(let index in names){
        that.webrtcControl.mediaStreams.push({
          name: names[index],
          username: usernames[index],
          stream: new MediaStream(),
        })
      }
      message.success(
        '成功进入房间',
        {nzDuration: that.successDuration}
      );
      that.webrtcControl.connected = true;
      //创建本地视频流
      rtc.createStream({
        "video": true,
        "audio": true
      });
    });

    //创建本地视频流成功
    rtc.on("stream_created", function (stream) {
      //创建视频流之后立刻静音
      rtc.changeVideoTrackMuted(false);
      rtc.changeAudioTrackMuted(false);
      that.webrtcControl.mediaStreams.splice(0,0,{
        name: '我',
        username: that.tokenService.get().username,
        stream: stream,
      })
      that.webrtcControl.currentDisplayMediaStreamIndex = 0;
      that.webrtcControl.mediaUsable = true;
      message.success(
        '视频流创建成功，显示在右下方',
        {nzDuration: that.successDuration}
      )
    });

    //创建本地视频流失败
    rtc.on("stream_create_error", function (error) {
      notification.error(
        '创建视频流失败',
        error.message,
      )
      that.disconnect();
    });

    //用户重复进入服务器
    rtc.on("repeatedName", function () {
      notification.error(
        '你已经在服务器中',
        '请检查是否你的账号在其他地方登录进入了服务器中',
        {nzDuration: that.successDuration}
      )
    });

    //删除其他用户
    rtc.on('remove_peer_video', function (name,username) {
      for(let i = 0 ; i < that.webrtcControl.mediaStreams.length; i++){
        if(username === that.webrtcControl.mediaStreams[i].username){
          that.webrtcControl.mediaStreams.splice(i,1);
          break;
        }
      }
      if(that.webrtcControl.currentDisplayMediaStreamIndex >= that.webrtcControl.mediaStreams.length)
        that.webrtcControl.currentDisplayMediaStreamIndex = that.webrtcControl.mediaStreams.length-1;
      message.success(name+'退出了房间',{nzDuration: that.successDuration})
    });

    //接收到其他用户的视频流
    rtc.on('pc_add_track', function (track, username) {
      let stream = <MediaStream> that.findStreamByUsername(username);
      if(track.kind === 'video'){
        if(stream.getVideoTracks().length !== 0){
          stream.removeTrack(stream.getVideoTracks()[0]);
          stream.addTrack(track);
        }else
          stream.addTrack(track);
      }else if(track.kind === 'audio'){
        if(stream.getAudioTracks().length !== 0){
          stream.removeTrack(stream.getAudioTracks()[0]);
          stream.addTrack(track);
        }else
          stream.addTrack(track)
      }else {
        notification.error('流轨道存在问题','错误代码044',{nzDuration: that.errorDuration});
      }
    });

    //当房间中有新用户加入时
    rtc.on('new_client_joined',function (name,username){
      that.webrtcControl.mediaStreams.push({
        name:name,
        username: username,
        stream: new MediaStream(),
      })
      message.success(name+'加入到了房间中',{nzDuration: that.successDuration})
    });

    //成功断开连接
    rtc.on('close_connection_successfully', function () {
      message.success('你已经成功退出了房间',{nzDuration: that.successDuration});
    });

    //接收到文字信息
    rtc.on('data_channel_message', function ( name,time, message) {
      that.zone.run(()=>that.webrtcControl.chatHistory.push({
        name: name,
        time: time,
        message: message
      }))
      that.webrtcControl.unreadChatNum++;
    });

    //重设本地流
    rtc.on("stream_reset", function (stream) {
      if(that.setStreamByName('我',stream))
        that.message.success('视频流切换成功',{nzDuration: that.successDuration});
      else
        that.message.error('视频流切换失败',{nzDuration: that.errorDuration});
    });

    //成功发送文件
    rtc.on("file_send_successful", function () {
      that.message.success('文件已发送给所有人');
      that.webrtcControl.fileList = [];
    });

    //接收到文件发送的请求
    rtc.on("receive_file_ask", function (sendId, socketId, fileName, fileSize) {
      that.modal.confirm({
        nzTitle: '是否接收文件?',
        nzContent: '文件名: '+fileName + '\n文件大小: '+fileSize + 'kb',
        nzOnOk: () =>{
          that.webrtcControl.rtc.sendFileAccept(sendId);
        },
        nzOnCancel: () =>{
          that.webrtcControl.rtc.sendFileRefuse(sendId);
        }
      })
    });

    //对方同意接收文件
    // rtc.on("send_file_accepted", function (sendId, socketId, file) {
    //   var p = document.getElementById("sf-" + sendId);
    //   p.innerText = "对方接收" + file.name + "文件，等待发送";
    //
    // });

    //对方拒绝接收文件
    // rtc.on("send_file_refused", function (sendId, socketId, file) {
    //   var p = document.getElementById("sf-" + sendId);
    //   p.innerText = "对方拒绝接收" + file.name + "文件";
    // });

    //发送文件碎片
    rtc.on('send_file_chunk', function (sendId, socketId, percent, file) {
      console.log(file.name + "文件正在发送: " + Math.ceil(percent) + "%")
      // var p = document.getElementById("sf-" + sendId);
      // p.innerText = file.name + "文件正在发送: " + Math.ceil(percent) + "%";
    });

    //接受文件碎片
    rtc.on('receive_file_chunk', function (sendId, socketId, fileName, percent) {
      console.log("正在接收" + fileName + "文件：" + Math.ceil(percent) + "%")
      // var p = document.getElementById("rf-" + sendId);
      // p.innerText = "正在接收" + fileName + "文件：" + Math.ceil(percent) + "%";
    });

    //接收到文件
    // rtc.on('receive_file', function (sendId, socketId, name) {
    //   var p = document.getElementById("rf-" + sendId);
    //   p.parentNode.removeChild(p);
    // });

    //发送文件时出现错误
    rtc.on('send_file_error', function (error) {
      console.log(error);
    });

    //接收文件时出现错误
    rtc.on('receive_file_error', function (error) {
      console.log(error);
    });

    //远程连接失败
    rtc.on('remote_control_fail', function (name,error) {
      that.notification.error('和'+name+'建立远程控制失败',
        error,{nzDuration: that.errorDuration})
    });

    //远程连接成功
    rtc.on('remote_control_success', function (name,track) {
      that.notification.success('和'+name+'建立远程控制成功',
        "连接已建立",{nzDuration: that.successDuration});
      let baseUrl = window.location.href.split('/')[3];
      if(baseUrl !== '#'){
        baseUrl = '';
      }
      let temp = window.open('_blank');
      temp.location.href=baseUrl + "/remoteControl/?controller="+that.tokenService.get().username+"&controlled="+that.webrtcControl.remoteControlUsername;
      // window.open(baseUrl + "/remoteControl/?controller="+that.tokenService.get().username+"&controlled="+that.webrtcControl.remoteControlUsername);
    });

    //连接请求确认
    rtc.on('receive_remote_control_ask', function (name,username) {
      that.modal.confirm({
        nzTitle: '是否接收远程控制请求?',
        nzContent: name+'请求控制您的屏幕',
        nzOnOk: () =>{
          that.webrtcControl.rtc.getDesktopTrack(username,that.tokenService.get().username);
        },
        nzOnCancel: () =>{
          that.webrtcControl.rtc.handleRemoteControlRequest(username,that.tokenService.get().username,"refuse",null,'目标用户拒绝了你的远程控制连接请求');
        }
      })
    });

    //错误的信息提示
    rtc.on('error',function (error){
      that.notification.error('错误',error,{nzDuration:that.errorDuration});
    });
  }

  openChatRoom(): void{
    this.chatRoomVisible = true;
    this.webrtcControl.unreadChatNum = 0;
  }

  closeChatRoom(): void{
    this.chatRoomVisible = false;
    this.webrtcControl.unreadChatNum = 0;
  }

  openCameras(): void{
    this.webrtcControl.roomCamerasVisible = true;
  }

  closeCameras():void{
    this.webrtcControl.roomCamerasVisible = false;
  }

  beforeUpload = (file: UploadFile): boolean => {
    let that = this;
    if(that.webrtcControl.fileList.length >= 2){
      this.notification.error('上传文件数量受限','一次最多选择两个文件进行上传',{nzDuration: this.errorDuration})
      return false;
    }
    that.webrtcControl.fileList = that.webrtcControl.fileList.concat(file);
    return false;
  };

  shareFiles(): void{
    let that = this;
    for(let file of that.webrtcControl.fileList){
      that.webrtcControl.rtc.shareFile(file);
    }
  }

  clearChatHistory() : void{
    this.webrtcControl.chatHistory = [];
  }

  broadcastMessage(): void{
    let that = this;
    let message = that.webrtcControl.chatMessage;
    let time = this.getTime();
    that.webrtcControl.rtc.broadcast(message,time);
    that.webrtcControl.chatHistory.push({
      name: '我',
      time: time,
      message: message,
    })
    that.webrtcControl.chatMessage = '';
  }

  getTime(): string {
    var today=new Date();
    var y=today.getFullYear();
    var m=today.getMonth();
    var d=today.getDate();
    var h=today.getHours();
    var i=today.getMinutes();
    var s=today.getSeconds();// 在小于10的数字钱前加一个‘0’
    m=m+1;
    d=this.checkTime(d);
    m=this.checkTime(m);
    i=this.checkTime(i);
    s=this.checkTime(s);
    return (y+"年"+m+"月"+d+"日"+" "+h+":"+i+":"+s)
  }
  checkTime(i){
    if (i<10){
      i="0" + i;
    }
    return i;
  }

  //如果返回的是false说明当前操作系统是手机端，如果返回的是true则说明当前的操作系统是电脑端
  IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone","SymbianOS", "Windows Phone","iPad", "iPod"];
    var flag = true;

    for (var v = 0; v < Agents.length; v++) {
      if (userAgentInfo.indexOf(Agents[v]) > 0) {
        flag = false;
        break;
      }
    }

    return flag;
  }

  shareDeviceChange(event): void{
    if(this.IsPC()){
      let device = event[0];
      let rtc = this.webrtcControl.rtc;
      if(device === 'shareCamera' || device === 'shareDesktop'){
        rtc.shareDeviceChange(device);
      }else if(device === 'shareRemoteControl'){

      }
    }else
      this.message.error('非pc端不可使用共享屏幕',{nzDuration: this.errorDuration})
  }

  remoteControlStart(event): void{
    let that = this;
    let controlledUsername = event[0];
    let myUsername = this.tokenService.get().username;
    that.webrtcControl.rtc.askRemoteControl(controlledUsername,myUsername);
  }

  setTitle(str) {
    window.onload = function() {
      document.title = str + "-Scratch";
    }
  }

  loadHistory() {
    let that = this;
    that.sceneService.getHistory(that.tokenService.get().id)
      .subscribe((res: HistoryResponseType) => {
        if (res.data.history !== {} && res.data.scene !== {}) {
          that.scene = res.data.scene;
          that.levelIndex = parseInt(res.data.history.level);
          that.level = eval("that.scene.l" + that.levelIndex);
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(res.data.history.script), that.workspace);
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          that.addObjectsToCanvas(objects);
        } else {
          that.notification.error('加载失败', '还不存在任何历史记录', { nzDuration: 2000 });
          that.normalPlay()
        }
      }, error => {
        that.notification.error('加载失败', '还不存在任何历史记录', { nzDuration: 2000 });
      });
  }

  loadCreate(){
    let id = this.sceneID;
    let that = this;
    that.sceneService.getScene(id)
      .subscribe((res: SceneResponseType) => {
        if (res.list && res.list.length) {
          that.scene = res.list[0];
          that.levelIndex = 1;
          that.level = that.scene.l1;
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(that.scene.script), that.workspace);
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          that.addObjectsToCanvas(objects);
        }
      });
  }

  loadSubmit(submit_id) {
    let that = this;
    that.sceneService.getSubmit(submit_id)
      .subscribe((res: any) => {
        if (res.msg === 'ok') {
          that.scene = res.scene;
          that.levelIndex = parseInt(res.history.level);
          that.level = eval("that.scene.l" + that.levelIndex);
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(res.history.script), that.workspace);
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          that.addObjectsToCanvas(objects);
        } else {
          that.notification.error('加载失败', '不存在该提交记录', { nzDuration: 2000 });
          that.normalPlay()
        }
      }, error => {
        that.notification.error('加载失败', '不存在该提交记录', { nzDuration: 2000 });
        that.normalPlay()
      })
  }

  createScene() {
    let id = this.sceneID;
    let that = this;
    that.sceneService.getScene(id)
      .subscribe((res: SceneResponseType) => {
        if (res.list && res.list.length) {
          that.scene = res.list[0];
          that.check_way = res.list[0].check_way;
          that.levelIndex = 1;
          that.level = that.scene.l1;
        }
      });
  }

  normalPlay() {
    let id = this.sceneID;
    let that = this;
    that.sceneService.getScene(id)
      .subscribe((res: SceneResponseType) => {
        if (res.list && res.list.length) {
          that.scene = res.list[0];
          that.levelIndex = 1;
          that.level = that.scene.l1;
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          // console.log(res.list[0]);
          that.addObjectsToCanvas(objects);
        }
      });
  }

  initCanvas() {
    const blocklyDiv = document.getElementById('blocklyDiv');
    this.workspace = Blockly.inject(blocklyDiv, blockly_options);
    let cnv = window.document.getElementById('cnvMain') as HTMLCanvasElement;
    this.cWidth = cnv.width;
    this.cHeight = cnv.height;
    this.cxt = cnv.getContext('2d');
    this.cxt.translate(this.cWidth / 2, this.cHeight / 2); // 坐标移到正中心
    let that = this;
    window.onbeforeunload = function(event) {
      if ([0, 2].indexOf(that.order) !== -1) {
        that.saveHistory();
        event.returnValue = "确定离开当前页面吗？";
      }
    };
  }

  addObjectsToCanvas(objects) {
    let baseUrl = 'https://121.4.43.229:6969/';
    if (objects.backgroundImg) {
      let url = objects.backgroundImg.indexOf('http') !== -1 ? objects.backgroundImg : (baseUrl + objects.backgroundImg);
      document.getElementById("background").style.backgroundImage = "url('" + url + "')";
      document.getElementById("background").style.backgroundSize = 'cover';
    }
    this.oldObjects = objects;
    let that = this;
    Object.keys(this.oldObjects).forEach(key => {
      if (typeof (this.oldObjects[key]) === 'object') {
        this.objects[key] = { ...this.oldObjects[key] }
      }
    });
    this.initImgResource();
    this.notification.success(`提示`,'资源加载中',{nzDuration:3000});
    setTimeout(function() {
      that.drawObjects(that.cxt);
    }, 3000);
  }

  similar(s, t, f) {
    if (!s || !t) {
      return 0
    }
    var l = s.length > t.length ? s.length : t.length;
    var n = s.length;
    var m = t.length;
    var d = [];
    f = f || 3;
    var min = function(a, b, c) {
      return a < b ? (a < c ? a : c) : (b < c ? b : c)
    };
    var i, j, si, tj, cost;
    if (n === 0) return m;
    if (m === 0) return n;
    for (i = 0; i <= n; i++) {
      d[i] = []
      d[i][0] = i
    }
    for (j = 0; j <= m; j++) {
      d[0][j] = j
    }
    for (i = 1; i <= n; i++) {
      si = s.charAt(i - 1);
      for (j = 1; j <= m; j++) {
        tj = t.charAt(j - 1);
        if (si === tj) {
          cost = 0
        } else {
          cost = 1
        }
        d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      }
    }
    let res = (1 - d[n][m] / l);
    return res.toFixed(f);
  }

  // 动画相关
  initImgResource(object = undefined) {
    if (object && object.pictures) {
      object.pictures.forEach(p => {
        if(p.img){
          return;
        }
        let img = new Image();
        img.src = p.path;
        img.onload = function() {
          p.img = img;
        };
      });
    } else {
      Object.keys(this.objects).forEach(item=>{
        if(typeof this.objects[item] === 'object' && this.objects[item] && this.objects[item].pictures){
          this.objects[item].pictures.forEach(p => {
            if(p.img){
              return;
            }
            let img = new Image();
            img.src = p.path;
            img.onload = function() {
              p.img = img;
            };
          });
        }
      })
    }
  }

  showObjects(){
    Object.keys(this.objects).forEach(key=>{
      if(typeof this.objects[key] === 'object'){
        this.notification.blank(`对象 ${key}`, ` x: ${this.objects[key].x} y: ${this.objects[key].x} ${this.objects[key].hide?'已隐藏':'显示'}`);
      }
    });

  }
  draw(cxt, object) {
    if (!object || typeof object !== 'object' || object.p < 0 || !object.pictures || object.p >= object.pictures.length || object.hide) {
      return;
    }
    let img = object.pictures[object.p].img;
    let theta = object.rotation * Math.PI / 180;
    cxt.rotate(-theta);
    let x = object.x * Math.cos(theta) + object.y * Math.sin(theta);
    let y = -object.y * Math.cos(theta) + object.x * Math.sin(theta);
    cxt.translate(-0.8 * img.width / 2, -0.8 * img.height / 2);
    cxt.drawImage(object.pictures[object.p].img, x, y, 0.8 * img.width, 0.8 * img.height);
    cxt.translate(0.8 * img.width / 2, 0.8 * img.height / 2);
    cxt.rotate(theta);
  }

  drawObjects(cxt) {
    Object.keys(this.objects).forEach(key=>{
      this.draw(cxt, this.objects[key]);
    });
  }

  clearCnv(cxt) {
    cxt.translate(-this.cWidth / 2, -this.cHeight / 2);
    cxt.clearRect(0, 0, this.cWidth, this.cHeight);
    cxt.translate(this.cWidth / 2, this.cHeight / 2);
  }

  render() {
    this.clearCnv(this.cxt);
    this.drawObjects(this.cxt);
  }

  runCode(): void {
    if (this.run) {
      return;
    }
    this.run = true;
    let that = this;
    let code = Blockly.JavaScript.workspaceToCode(this.workspace);
    interpreter.setObjects({ ...this.objects, show: this.notification, cWidth: this.cWidth, cHeight: this.cHeight });
    this.h = setInterval(function() {
      if (interpreter.next()) {
        interpreter.run();
        that.render();
      } else {
        clearInterval(that.h);
        that.run = false;
        interpreter.steps = [];
        interpreter.stepIndex = 0;
      }
    }, 30);
  }

  stopCode(): void {
    clearInterval(this.h);
    this.run = false;
    interpreter.steps = [];
    interpreter.stepIndex = 0;
  }

  clear(): void {
    clearInterval(this.h);
    this.run = false;
    interpreter.steps = [];
    interpreter.stepIndex = 0;
    this.objects = {};
    Object.keys(this.oldObjects).forEach(key => {
      if (typeof (this.oldObjects[key]) === 'object') {
        this.objects[key] = { ...this.oldObjects[key] }
      }
    });
    this.clearCnv(this.cxt);
    this.drawObjects(this.cxt);
    interpreter.setObjects({ ...this.objects, show: this.notification, cWidth: this.cWidth, cHeight: this.cHeight });
  }

  // 创建场景相关
  uploadObjects() {
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
  }


  addScenePictures() {
    let baseUrl = 'https://www.pikachu.today/pictures/background/';
    let bg = ['Underwater.png', 'Start.png', 'Soccer.png', 'Mountain.png', 'Galaxy.png', 'Desert.png', 'Castle.png', 'Boardwalk.png'];
    this.bgPictures = [];
    bg.forEach((item, index) => {
      if (!(index % 3)) {
        this.bgPictures.push([])
      }
      this.bgPictures[Math.floor(index / 3)].push({ src: baseUrl + item, title: item.split('.')[0] })
    });
  }

  addMovePictures() {
    let baseUrl = 'https://www.pikachu.today/pictures/';
    let bg = ['blockly_zebra', 'blockly_fish', 'blockly_cat2', 'blockly_cat', 'blockly_basketball', 'blockly_arrow', 'blockly_apple'];
    this.movePictures = [];
    bg.forEach((item, index) => {
      if (!(index % 4)) {
        this.movePictures.push([])
      }
      this.movePictures[Math.floor(index / 4)].push({ src: baseUrl + item + '/p1.svg', title: item.split('_')[1] })
    })
  }

  addOtherPictures() {
    let context = ['blockly_zebra', 'blockly_fish', 'blockly_cat2', 'blockly_cat', 'blockly_basketball', 'blockly_arrow', 'blockly_apple'];
    let baseUrl = 'https://www.pikachu.today/pictures/';
    this.otherPictures = [];
    context.forEach((item, index) => {
      if (!(index % 4)) {
        this.otherPictures.push([])
      }
      this.otherPictures[Math.floor(index / 4)].push({ src: baseUrl + item + '/p1.svg', title: item.split('_')[1] })
    })
  }

  chooseBackgroundImg(i, j) {
    this.bgSelectedIndex = 3 * i + j;
    document.getElementById("background").style.backgroundImage = "url('" + this.bgPictures[i][j].src + "')";
    document.getElementById("background").style.backgroundSize = 'cover';
    this.objects.backgroundImg = this.bgPictures[i][j].src;
    this.oldObjects.backgroundImg = this.bgPictures[i][j].src;
  }

  chooseObject(i, j) {
    this.moveObjectSelectedIndex = 4 * i + j;
    let o = { x: 0, y: 0, pictures: [{ path: this.movePictures[i][j].src },{path: this.movePictures[i][j].src.split('1.svg')[0] + '2.svg' }],
      p:0, rotation:0, hide: false};

    this.objects.moveObject = o;
    this.oldObjects.moveObject = {...o};
    this.coordinate1 = this.movePictures[i][j].src.split('blockly_')[1].split('/')[0];

    this.initImgResource(o);
    let that = this;
    this.clearCnv(this.cxt);


    setTimeout(function() {
      Object.keys(that.objects).forEach(key => {
        that.draw(that.cxt, that.objects[key]);
      });
    }, 1000);
  }

  // 点击其他角色的图片
  chooseOtherObject(i, j) {
    // 图片
    let picture = this.movePictures[i][j];
    // 对象名
    let name = picture.src.split('blockly_')[1].split('/')[0];
    if (this.objects[name]) {
      // 点击第二次表示取消选择
      this.otherPictures[i][j].selected = false;
      this.objects[name] = undefined;
      this.oldObjects[name] = undefined;
      this.coordinate2 = '';
      this.x2 = 0;
      this.y2 = 0;
      this.clearCnv(this.cxt);
      Object.keys(this.objects).forEach(key => {
        this.draw(this.cxt, this.objects[key]);
      });
    } else {
      // 选中
      this.otherPictures[i][j].selected = true;

      // 构造对象
      let o = { x: 0, y: 0, pictures: [], p:0, rotation:0, hide: false };
      o.pictures = [{ path: this.otherPictures[i][j].src }, { path: this.otherPictures[i][j].src.split('1.svg')[0] + '2.svg' }];
      this.objects[name] = o;
      this.oldObjects[name] = {...o};
      // 图像资源预加载
      this.initImgResource(o);
      // 坐标框初始化
      this.coordinate2 = name;
      this.x2 = this.objects[name].x;
      this.y2 = this.objects[name].y;

      // 重绘所有图片
      let that = this;
      this.clearCnv(this.cxt);
      setTimeout(function() {
        Object.keys(that.objects).forEach(key => {
          that.draw(that.cxt, that.objects[key]);
        });
      }, 1000);
    }
  }

  // 确认对象的位置
  confirmCoordinate(coordinateName, x, y, kind) {
    if (!coordinateName || (kind && !this.objects.moveObject) || (!kind && !this.objects[coordinateName])) {
      return;
    }
    if(kind){
      this.objects.moveObject.x = x;
      this.objects.moveObject.y = y;
      this.oldObjects.moveObject.x = x;
      this.oldObjects.moveObject.y = y;
    } else {
      this.objects[coordinateName].x = x;
      this.objects[coordinateName].y = y;
      this.oldObjects[coordinateName].x = x;
      this.oldObjects[coordinateName].y = y;
    }
    this.clearCnv(this.cxt);
    // 重绘所有图片
    Object.keys(this.objects).forEach(key => {
      this.draw(this.cxt, this.objects[key]);
    });
  }

  setCoordinate2(i, j){
    let name = this.otherPictures[i][j].src.split('blockly_')[1].split('/')[0];
    if(this.objects[name]){
      this.coordinate2 = name;
      this.x2 = this.objects[name].x;
      this.y2 = this.objects[name].y;
    }
  }

  reRender(){
    this.clearCnv(this.cxt);
    // 重绘所有图片
    Object.keys(this.objects).forEach(key=>{
      this.draw(this.cxt, this.objects[key]);
    });
  }

  // 场景切换相关
  nextLevel() {
    if(this.levelIndex >= this.scene.level_number){
      return;
    }
    this.levelIndex ++;
    this.level = eval("this.scene.l" + this.levelIndex);
  }

  prevLevel() {
    if(this.levelIndex <= 1){
      return;
    }
    this.levelIndex --;
    this.level = eval("this.scene.l" + this.levelIndex);
  }

  // 提交场景，模态框相关
  handleCancel(){
    this.isVisible = false;
    this.isOkLoading = false;
  }
  handleOk(): void {
    if(this.order === 3){
      this.isVisible = false;
      this.isOkLoading = false;
      return;
    }
    let that = this;
    this.isOkLoading = true;
    var xml = Blockly.Xml.workspaceToDom(this.workspace);
    var xml_text = Blockly.Xml.domToText(xml);
    let observableObject = undefined;
    if(this.order === 1){ // 创建场景时提交的数据
      if(!this.oldObjects.moveObject || !this.oldObjects.moveObject.pictures || !this.oldObjects.moveObject.pictures.length){
        this.notification.error('失败', '必须设置可移动对象');
        this.isVisible = false;
        this.isOkLoading = false;
        return;
      }
      if(!this.check_way && !Blockly.JavaScript.workspaceToCode(this.workspace)){
        this.notification.error('失败', '机器核定场景必须搭建积木');
        this.isVisible = false;
        this.isOkLoading = false;
        return;
      }
      let submitObjects:any = {};
      Object.keys(this.oldObjects).forEach(key=>{
        if(this.oldObjects[key]){
          if(typeof this.oldObjects[key] === 'object' ){
            let pictures = [{path:''},{path:''}];
            pictures[0].path = this.oldObjects[key].pictures[0].path;
            pictures[1].path = this.oldObjects[key].pictures[1].path;
            submitObjects[key] = { ...this.oldObjects[key], pictures};
          } else {
            submitObjects[key] = this.oldObjects[key];
          }

        }
      });
      observableObject = this.sceneService.updateScene({
        scene_id: parseInt(that.sceneID),
        script: xml_text,
        objects: JSON.stringify(submitObjects),
        picture: submitObjects.backgroundImg?submitObjects.backgroundImg:''
      });
    } else {
      // 学习场景时使用
      let score = 0;
      let result = '';
      if(!that.scene.check_way){
        score = parseInt('' + this.similar(this.handleScript(xml_text), this.handleScript(this.scene.script),0) * 100);
        if(score > 90){
          result = '机器核定优秀';
        } else if(score > 80){
          result = '机器核定良好';
        } else if(score > 60){
          result = '机器核定及格';
        } else {
          result = '机器核定不及格';
        }
      }
      observableObject = this.sceneService.submit({
        scene_id: parseInt(that.sceneID),
        student_id: that.tokenService.get().id,
        script: xml_text,
        objects: JSON.stringify(that.scene.objects),
        level: that.levelIndex,
        score: score,
        result: result,
        check_way: that.scene.check_way
      });
    }
    observableObject.subscribe((res:any)=>{
      this.isVisible = false;
      this.isOkLoading = false;
      if(res.msg === 'ok'){
        that.notification.success('成功','提交成功');
      } else {
        that.notification.error('失败','提交失败，重复提交');
      }
    },error => {
      this.isVisible = false;
      this.isOkLoading = false;
      that.notification.error('失败','提交失败，重复提交');
    })
  }

  // 处理掉script中的id部分
  handleScript(str){
    let result = '';
    while(str.indexOf(' id="') !== -1){
      result += str.substring(0, str.indexOf(' id="'));
      str = str.substring(str.indexOf('"',str.indexOf(' id="') + 5) + 1);
    }
    result += str;
    let xIndex = result.indexOf(' x="');
    if(xIndex !== -1){
      result = result.substring(0, xIndex) + result.substring(result.indexOf('"',xIndex + 4) + 1);
    }

    let yIndex = result.indexOf(' y="');
    if(yIndex !== -1){
      result = result.substring(0, yIndex) + result.substring(result.indexOf('"',yIndex + 4) + 1);
    }
    return result;
  }

  submit() {
    if(this.isVisible){
      return;
    }
    this.isVisible = true;
  }

  saveHistory(){
    let that = this;
    var xml = Blockly.Xml.workspaceToDom(this.workspace);
    var xml_text = Blockly.Xml.domToText(xml);
    if(xml_text === "<xml xmlns=\"https://developers.google.com/blockly/xml\"></xml>"){
      return;
    }
    this.sceneService.saveHistory({
      scene_id: parseInt(that.sceneID),
      user_id: that.tokenService.get().id,
      script: xml_text,
      objects: that.scene.objects,
      level: that.levelIndex
    }).subscribe(res=>{
      console.log('保存历史记录',res);
    });
  }

  /**************webrtc部分****************/
  connect(): void{
    if(this.checkInputRoomID(this.webrtcControl.inputRoomIDString)){
      this.webrtcControl.rtc.connect(
        "wss://www.xytcloud.ltd:4433/xyt",
        this.webrtcControl.roomID,
        this.tokenService.get().username,
        this.tokenService.get().name,
        )
    }
  }

  setStreamByName(name,stream): boolean{
    let that = this;
    for(let item of that.webrtcControl.mediaStreams){
      if(item.name === name){
        item.stream = stream;
        return true;
      }
    }
    return false;
  }

  findStreamByUsername(username): object{
    let that = this;
    for(let item of that.webrtcControl.mediaStreams){
      if(item.username === username){
        return item.stream;
      }
    }
    return null;
  }

  checkInputRoomID(str): boolean{
    const reg = new RegExp("^[0-9]*$");
    if(str === ""){
      this.notification.create(
        'error',
        '输入的房间号不能为空',
        '请输入你想要进入的房间号（纯数字）',
        {nzDuration: this.errorDuration}
      );
      return false;
    }else if(!reg.test(str)){
      this.notification.create(
        'error',
        '房间号格式错误',
        '输入的房间号必须为纯数字',
        {nzDuration: this.errorDuration}
      );
      return false;
    }else {
      this.webrtcControl.roomID = parseInt(str);
      return true;
    }
  }

  disconnect(): void{
    let that = this;
    this.webrtcControl.connected = false;
    let rtc = this.webrtcControl.rtc;
    rtc.closeConnectionWithServer();
    that.webrtcControl.mediaStreams = [];
    that.webrtcControl.videoControl = 'close';
    that.webrtcControl.audioControl = 'close';
    that.webrtcControl.shareValue = 'shareCamera';
    that.webrtcControl.currentDisplayMediaStreamIndex = undefined;
    that.webrtcControl.mediaUsable = false;
    that.webrtcControl.connected = false;
    that.webrtcControl.roomID = undefined;
    that.webrtcControl.inputRoomIDString = '';
  }

  videoControlChanged(event): void{
    let rtc = this.webrtcControl.rtc;
    let operation = event[0];
    if(operation === 'close'){
      rtc.changeVideoTrackMuted(false);
      this.message.success(
        '摄像头已关闭',
        {nzDuration: this.successDuration}
      )
    }else if(operation === 'open'){
      rtc.changeVideoTrackMuted(true);
      this.message.success(
        '摄像头已打开',
        {nzDuration: this.successDuration}
      )
    }else {
      this.notification.error(
        '出现了未知的错误',
        '错误代码042',
        {nzDuration: this.errorDuration}
      )
    }
  }

  audioControlChanged(event): void{
    let rtc = this.webrtcControl.rtc;
    let operation = event[0];
    if(operation === 'close'){
      rtc.changeAudioTrackMuted(false);
      this.message.success(
        '音频已关闭',
        {nzDuration: this.successDuration}
      )
    }else if(operation === 'open'){
      rtc.changeAudioTrackMuted(true);
      this.message.success(
        '音频已打开',
        {nzDuration: this.successDuration}
      )
    }else {
      this.notification.error(
        '出现了未知的错误',
        '错误代码043',
        {nzDuration: this.errorDuration}
      )
    }
  }

  videoError(){

  }

  // 新手引导
  handleHelpOk() {
    if (this.currentIndex != this.allMsg.length - 1) {
      this.currentIndex++;
      if (this.currentIndex == this.allMsg.length - 1) {
        this.buttonMsg = '完成';
      }
    } else {
      this.helpIsVisible = false;
    }

  }

  handleHelpCancel() {
    this.helpIsVisible = false;
  }

  show() {
    this.buttonMsg = '下一步';
    this.currentIndex = 0;
    this.helpIsVisible = true;
  }
}
