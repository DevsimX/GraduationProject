import {Component, Inject, NgZone, OnInit} from "@angular/core";
import {SceneService} from "../../services/scene.service";
import {ActivatedRoute} from "@angular/router";
import {NzMessageService, NzNotificationService} from "ng-zorro-antd";
import {NzModalService} from "ng-zorro-antd/modal";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Component({
  selector: 'app-remote-control',
  templateUrl: './remoteControl.component.html',
  styles: [],
  styleUrls: ['./remoteControl.component.less'],
})
export class RemoteControlComponent implements OnInit {
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

  ngOnInit(): void {}
}
