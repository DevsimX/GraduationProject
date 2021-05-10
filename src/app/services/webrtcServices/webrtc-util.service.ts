import {Injectable} from '@angular/core';
import {ConstantService} from "../constant.service";
import {Neighbour} from "./neighbours.service";
import {Socket} from "socket.io-client";

interface chatHistoryType {
  name?: string;
  time?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebrtcUtilService {
  /*
  server info
   */
  private _path: string = this.constant.webrtc_path;
  private _webSocket: WebSocket = undefined;
  private _socket:Socket = undefined;

  /*
  client info
   */
  private _room_id: number = undefined;
  private _username: string = undefined;
  private _name: string = undefined;
  private _socket_id: string = undefined;

  /*
  media info
   */
  private _mediaUsable: boolean = false;
  private _localMediaStream: MediaStream = undefined;

  /*
  state info
   */
  private _connected: boolean = false;

  /*
  event emitter
   */
  private _events: any = {}

  /*
  util info
   */

  /*
  message info
   */
  private _chatMessages: chatHistoryType[] = [];
  private _unreadChatMessageNum: number = 0;

  /*
  file info
   */
  private _receiveFiles = {}

  /*
  neighbour info
   */
  private _neighbours: Neighbour[] = []

  constructor(
    private constant: ConstantService,
  ) {
  }

  get path(): string {
    return this._path;
  }

  set path(value: string) {
    this._path = value;
  }

  get webSocket(): WebSocket {
    return this._webSocket;
  }

  set webSocket(value: WebSocket) {
    this._webSocket = value;
  }

  get room_id(): number {
    return this._room_id;
  }

  set room_id(value: number) {
    this._room_id = value;
  }

  get username(): string {
    return this._username;
  }

  set username(value: string) {
    this._username = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get socket_id(): string {
    return this._socket_id;
  }

  set socket_id(value: string) {
    this._socket_id = value;
  }

  get mediaUsable(): boolean {
    return this._mediaUsable;
  }

  set mediaUsable(value: boolean) {
    this._mediaUsable = value;
  }

  get localMediaStream(): MediaStream {
    return this._localMediaStream;
  }

  set localMediaStream(value: MediaStream) {
    this._localMediaStream = value;
  }

  get connected(): boolean {
    return this._connected;
  }

  set connected(value: boolean) {
    this._connected = value;
  }

  get events(): any {
    return this._events;
  }

  set events(value: any) {
    this._events = value;
  }

  get chatMessages(): chatHistoryType[] {
    return this._chatMessages;
  }

  set chatMessages(value: chatHistoryType[]) {
    this._chatMessages = value;
  }

  get unreadChatMessageNum(): number {
    return this._unreadChatMessageNum;
  }

  set unreadChatMessageNum(value: number) {
    this._unreadChatMessageNum = value;
  }

  get receiveFiles(): {} {
    return this._receiveFiles;
  }

  set receiveFiles(value: {}) {
    this._receiveFiles = value;
  }

  get neighbours(): Neighbour[] {
    return this._neighbours;
  }

  set neighbours(value: Neighbour[]) {
    this._neighbours = value;
  }

  get socket(): Socket {
    return this._socket;
  }

  set socket(value: Socket) {
    this._socket = value;
  }

  closeDataChannel(channel: RTCDataChannel): boolean {
    if (!channel) return false;
    channel.close();
    return true;
  }

  closePeerConnection(peerConnection: RTCPeerConnection): boolean {
    if (!peerConnection) return false;
    peerConnection.close();
    return true;
  };

  /*
  事件处理器部分，用于主动调用事件
   */
  on(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  }

  emit(eventName, _) {
    let events = this.events[eventName],
      args = Array.prototype.slice.call(arguments, 1),
      i, m;

    if (!events) {
      return;
    }
    for (i = 0, m = events.length; i < m; i++) {
      events[i].apply(null, args);
    }
  };
}
