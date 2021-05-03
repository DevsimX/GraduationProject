import { Injectable } from '@angular/core';
import {ClientService} from "./client.service";
import {NeighboursService} from "./neighbours.service";
import {NotificationMessage} from "../../object/webrtc/notification-message";

@Injectable()
export class WebrtcService {

  constructor(
    private clientService: ClientService,
    private neighboursService: NeighboursService
  ){ }

  /*
  @input: room_id
  @output:
   */
  connect(room_id: string, username: string, name: string){
    console.log("abcd")
    if(!this.checkRoomIDLegality(room_id)){

    }else {

    }
  }

  /*
  @input: room_id
  @output:
    if room_id is purely numerical, return null
    if room_id is empty or non-numerical, return error type
   */
  checkRoomIDLegality(room_id: string): NotificationMessage{
    const reg = new RegExp("^[0-9]*$");
    if(room_id === ""){
      return new NotificationMessage(
        'error',
        '输入的房间号不能为空',
        '请输入你想要进入的房间号（纯数字）',
        );
    }else if(!reg.test(room_id)){
      return new NotificationMessage(
        'error',
        '房间号格式错误',
        '输入的房间号必须为纯数字',
      );
    }else {
      return null;
    }
  }
}
