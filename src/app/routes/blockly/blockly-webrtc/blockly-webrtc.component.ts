import {Component, Inject, OnInit, SimpleChanges} from '@angular/core';
import {WebrtcService} from "../../../services/webrtcServices/webrtc.service";
import {NotificationMessage} from "../../../object/webrtc/notification-message";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {NzMessageService} from "ng-zorro-antd/message";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {NzUploadFile} from "ng-zorro-antd/upload";
import {WebrtcUtilService} from "../../../services/webrtcServices/webrtc-util.service";

@Component({
  selector: 'app-blockly-webrtc',
  templateUrl: './blockly-webrtc.component.html',
  styles: []
})
export class BlocklyWebrtcComponent implements OnInit {
  input_room_id_string: string = "";
  videoStreamState: string = 'close';
  audioStreamState: string = 'close';
  shareDevice: string = 'shareCamera';
  roomCamerasVisible: boolean = false;
  chatRoomVisible: boolean = false;
  files: NzUploadFile[] = [];
  chatMessage: string = '';


  constructor(
    private webrtcService: WebrtcService,
    public webrtcUtilService: WebrtcUtilService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
  ) {
  }

  ngOnInit(): void {
    console.log(this.webrtcUtilService.mediaUsable)
  }

  connectToServer(): void {
    if(!this.webrtcService.testServerConnection()){
      return
    }
    if (this.checkRoomIDLegality(this.input_room_id_string)) {
      let room_id_int = parseInt(this.input_room_id_string);
      let username = this.tokenService.get().username;
      let name = this.tokenService.get().name;

      let res = this.webrtcService.connect(room_id_int, username, name);

      if (!res) {
        this.notification.error(
          '连接服务器失败',
          res,
        )
      } else {
        this.listenToWebrtcService()
      }
    }
  }

  disconnectFromServer() {
    this.webrtcService.clear();
  }

  nzBeforeUpload(file: NzUploadFile): boolean {
    if (this.files.length >= 2) {
      this.notification.error('上传文件数量受限', '一次最多选择两个文件进行上传')
      return false;
    }
    this.files = this.files.concat(file);
    return false;
  };

  clearChatHistory() {
    this.webrtcUtilService.chatMessages = [];
  }

  broadcastMessage() {
    let time = this.getTime();
    this.webrtcService.broadcast(this.chatMessage, time);
    this.webrtcUtilService.chatMessages.push({
      name: '我',
      time: time,
      message: this.chatMessage,
    })
    this.chatMessage = '';
  }

  changeShareDevice(event) {
    if (this.isPC()) {
      let device = event[0];
      if (device === 'shareCamera' || device === 'shareDesktop') {
        this.webrtcService.changeShareDevice(device)
      }
    } else
      this.message.error('非pc端不可使用共享屏幕')
  }

  /*
  stream control part
   */
  changeVideoStreamState(event) {
    let operation = event[0];
    switch (operation) {
      case "close":
        this.message.success(
          '摄像头已关闭'
        )
        this.webrtcService.changeVideoStreamState(false);
        break;
      case "open":
        this.message.success(
          '摄像头已打开'
        )
        this.webrtcService.changeVideoStreamState(true);
        break;
      default:
        this.notification.error(
          '出现了未知的错误',
          '错误代码042'
        )
        break;
    }
  }

  changeAudioStreamState(event) {
    let operation = event[0];
    switch (operation) {
      case "close":
        this.message.success(
          '音频已关闭',
        )
        this.webrtcService.changeAudioStreamState(false);
        break;
      case "open":
        this.message.success(
          '音频已打开',
        )
        this.webrtcService.changeAudioStreamState(true);
        break;
      default:
        this.notification.error(
          '出现了未知的错误',
          '错误代码043'
        )
        break;
    }
  }

  /*
  listen to webrtc service
   */
  listenToWebrtcService() {

  }

  /*
  send file part
   */
  shareFiles() {
    for (let file of this.files) {
      this.webrtcService.shareFile(file);
    }
  }


  /*
  util part
   */

  /*
  @input: room_id
  @output:
    if room_id is purely numerical, notify error, return false
    if room_id is empty or non-numerical, notify error, return false
    else return true
   */
  checkRoomIDLegality(room_id: string): boolean {
    const reg = new RegExp("^[0-9]*$");
    if (room_id === "") {
      this.notification.error(
        '输入的房间号不能为空',
        '请输入你想要进入的房间号（纯数字）',
      )
      return false;
    } else if (!reg.test(room_id)) {
      this.notification.error(
        '房间号格式错误',
        '输入的房间号必须为纯数字',
      )
      return false;
    } else {
      //check result is legal
      return true;
    }
  }

  isPC(): boolean {
    let userAgentInfo = navigator.userAgent;
    let Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    let flag = true;

    for (let v = 0; v < Agents.length; v++) {
      if (userAgentInfo.indexOf(Agents[v]) > 0) {
        flag = false;
        break;
      }
    }
    return flag;
  }

  openChatRoom() {
    this.chatRoomVisible = true;
    this.webrtcUtilService.unreadChatMessageNum = 0;
  }

  closeChatRoom() {
    this.chatRoomVisible = false;
    this.webrtcUtilService.unreadChatMessageNum = 0;
  }

  closeCameras(){
    this.roomCamerasVisible = false;
  }

  openCameras(){
    this.roomCamerasVisible = true;
  }

  getTime(): string {
    let today = new Date();
    let y = today.getFullYear();
    let m = today.getMonth();
    let d = today.getDate();
    let h = today.getHours();
    let i = today.getMinutes();
    let s = today.getSeconds();// 在小于10的数字钱前加一个‘0’
    m = m + 1;
    d = this.checkTime(d);
    m = this.checkTime(m);
    i = this.checkTime(i);
    s = this.checkTime(s);
    return (y + "年" + m + "月" + d + "日" + " " + h + ":" + i + ":" + s)
  }

  checkTime(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }

}
