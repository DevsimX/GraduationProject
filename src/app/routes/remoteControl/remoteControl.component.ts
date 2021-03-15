import {Component, Inject, NgZone, OnInit} from "@angular/core";
import {SceneService} from "../../services/scene.service";
import {ActivatedRoute} from "@angular/router";
import {NzMessageService, NzNotificationService} from "ng-zorro-antd";
import {NzModalService} from "ng-zorro-antd/modal";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import * as $ from 'jquery';

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
          that.track = data;
        },
      });
      that.videoStream.addTrack(that.track);
    });
  }
}
