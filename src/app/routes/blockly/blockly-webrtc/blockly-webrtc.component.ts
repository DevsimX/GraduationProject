import {Component, Inject, OnInit, SimpleChanges} from '@angular/core';
import {WebrtcService} from "../../../services/webrtcServices/webrtc.service";
import {NotificationMessage} from "../../../object/webrtc/notification-message";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {NzMessageService} from "ng-zorro-antd/message";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {NzUploadFile} from "ng-zorro-antd/upload";
import {WebrtcUtilService} from "../../../services/webrtcServices/webrtc-util.service";
import {catchError} from "rxjs/operators";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Subject, throwError} from "rxjs";
import {io, Socket} from "socket.io-client";

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
  connectionError:Subject<string> = new Subject<string>();


  constructor(
    private webrtcService: WebrtcService,
    public webrtcUtilService: WebrtcUtilService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private http: HttpClient,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
  ) {
  }

  ngOnInit(): void {
    this.connectionError.subscribe({
      next: (err) => this.notification.error('服务器连接错误',err)
    })

    this.webrtcService.connectedSubject.subscribe({
      next: (info) => {
        this.message.success('你已经连接到房间中');
        this.webrtcService.createStream({
          "video": true,
          "audio": true
        })
      }
    })

    this.webrtcService.notifySubject.subscribe({
      next: (info) => {
        switch (info.type) {
          case 'success':
            this.notification.success(info.title,info.content)
            break;
          case 'error':
            this.message.error(info.title,info.content)
            break;
        }
      }
    })

    this.webrtcService.messageSubject.subscribe({
      next: (info) => {
        switch (info.type) {
          case 'success':
            this.message.success(info.content)
            break;
          case 'error':
            this.message.error(info.content)
            break;
        }
      }
    })
  }

  disconnectFromServer() {
    this.webrtcService.clear();
  }

  connect(){
    if(this.input_room_id_string === ''){
      this.message.error('输入的房间号不能为空')
      return;
    }
    if(this.webrtcUtilService.socket && this.webrtcUtilService.socket.connected){
      this.message.error('你已经在房间当中，请退出房间后重新进入')
      return;
    }
    let room = this.input_room_id_string;
    let username = this.tokenService.get().username;
    let name = this.tokenService.get().name;
    this.webrtcService.connect(room,username,name);
  }

  private handleError(error: HttpErrorResponse) {
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
    //TODO
    this.connectionError.next(error.error.message);
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }

  nzBeforeUpload(file: NzUploadFile): boolean {
    if (this.files.length >= 2) {
      this.notification.error('上传文件数量受限', '一次最多选择两个文件进行上传')
      return false;
    }
    this.files = this.files.concat(file);
    return false;
  };

  sendChatMessageToAll() {
    let time = this.getTime();
    this.webrtcService.broadcast(this.chatMessage, time);
    this.webrtcUtilService.chatMessages.push({
      name: '我',
      time: time,
      message: this.chatMessage,
    })
    this.chatMessage = '';
  }

  clearChatHistory() {
    this.webrtcUtilService.chatMessages = [];
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
        this.webrtcService.changeVideoStreamEnabledState(false);
        break;
      case "open":
        this.message.success(
          '摄像头已打开'
        )
        this.webrtcService.changeVideoStreamEnabledState(true);
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
        this.webrtcService.changeAudioStreamEnabledState(false);
        break;
      case "open":
        this.message.success(
          '音频已打开',
        )
        this.webrtcService.changeAudioStreamEnabledState(true);
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
