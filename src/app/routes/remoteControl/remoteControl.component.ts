import {Component, Inject, NgZone, OnInit} from "@angular/core";
import {SceneService} from "../../services/scene.service";
import {ActivatedRoute} from "@angular/router";
import {NzModalService} from "ng-zorro-antd/modal";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import * as $ from 'jquery';
import {NzNotificationService} from "ng-zorro-antd/notification";
import {NzMessageService} from "ng-zorro-antd/message";

@Component({
  selector: 'app-remote-control',
  templateUrl: './remoteControl.component.html',
  styles: [],
  styleUrls: ['./remoteControl.component.less'],
})
export class RemoteControlComponent implements OnInit {
  track = undefined;
  controller:string = undefined;
  controlled:string = undefined;
  videoStream = new MediaStream();
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

  stringToFunction(obj){  // 将对象中的函数字符串转化为函数
    var regex =  /^((function\s)|.)([a-zA-Z_][a-zA-Z0-9_]*)\(.*\)\s\{.*\}/  //匹配函数字符串
    for(let key in obj){
      if(obj[key] instanceof Object){
        this.stringToFunction(obj[key]);
      }else{
        if(regex.test(obj[key])){ // 是一个函数
          try{
            let params = obj[key].substring(obj[key].indexOf('(')+1,obj[key].indexOf(')'));
            let operation = obj[key].substring(obj[key].indexOf("{")+1,obj[key].length-1);
            obj[key] = new Function(params, operation);
          }catch(e){
            console.log(e)
          }
        }
      }
    }
    return obj
  }

  stringToObject(string){  // 用于替代JSON.parse
    let obj = JSON.parse(string);  //将字符串转为对象
    return this.stringToFunction(obj)    // 将对象中的函数字符串转为函数
  }

  ngOnInit(): void {
    let that = this;
    that.route.queryParams.subscribe((query) => {
      that.controller = query.controller;
      that.controlled = query.controlled;
      let queryParams = {controller: query.controller,controlled: query.controlled}
      $.ajax({
        type: "POST",
        url: 'https://xytcloud.ltd:8001/remoteControlGetTrack/',
        data: queryParams,
        async: false,
        success: function (data) {
          console.log(data)
          that.track = that.stringToObject(data);
        },
      });
      that.videoStream.addTrack(that.track);
    });
  }

}
