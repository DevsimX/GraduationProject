import { NgModule } from '@angular/core';

import { SharedModule } from '@shared';
import { RouteRoutingModule } from './routes-routing.module';
// dashboard pages
import { DashboardComponent } from './dashboard/dashboard.component';
// passport pages
import { UserLoginComponent } from './passport/login/login.component';
import { UserRegisterComponent } from './passport/register/register.component';
import { UserRegisterResultComponent } from './passport/register-result/register-result.component';
// single pages
import { CallbackComponent } from './callback/callback.component';
import { UserLockComponent } from './passport/lock/lock.component';
import { BlocklyComponent } from './blockly/blockly.component';

import {ListComponent} from './list/list.component';
import { ProgressComponent } from './progress/progress.component';
import { WelcomeComponent } from './welcome/welcome.component';

import { StatisticsComponent } from './statistics/statistics.component';
import { AssessmentComponent } from './assessment/assessment.component';
import { CreateComponent } from './create/create.component';
import { AssessmentSuccessComponent} from './assessment/assessmentSucess/assessmentSuccess.component';
import {AllSceneComponent} from './allScene/allScene.component';

import {RemoteControlComponent} from "./remoteControl/remoteControl.component";
import {CanvasWhiteboardModule} from "ng2-canvas-whiteboard";
import {PageHeaderModule} from "@delon/abc/page-header";
import {NzCardModule} from "ng-zorro-antd/card";
import {NzTableModule} from "ng-zorro-antd/table";
import {NzTagModule} from "ng-zorro-antd/tag";
import {NzDrawerModule} from "ng-zorro-antd/drawer";
import {NzFormModule} from "ng-zorro-antd/form";
import {NzInputNumberModule} from "ng-zorro-antd/input-number";
import {NzInputModule} from "ng-zorro-antd/input";
import {NzModalModule} from "ng-zorro-antd/modal";
import {NzAvatarModule} from "ng-zorro-antd/avatar";
import {NzIconModule} from "ng-zorro-antd/icon";
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzTabsModule} from "ng-zorro-antd/tabs";
import {NzCheckboxModule} from "ng-zorro-antd/checkbox";
import {NzDropDownModule} from "ng-zorro-antd/dropdown";
import {NzRadioModule} from "ng-zorro-antd/radio";
import {NzUploadModule} from "ng-zorro-antd/upload";
import {NzBadgeModule} from "ng-zorro-antd/badge";
import {NzEmptyModule} from "ng-zorro-antd/empty";
import {WhiteboardComponent} from "../whiteboard/whiteboard.component";
import { BlocklyWebrtcComponent } from './blockly/blockly-webrtc/blockly-webrtc.component';
import {NzCommentModule} from "ng-zorro-antd/comment";

const COMPONENTS = [
  DashboardComponent,
  // passport pages
  UserLoginComponent,
  UserRegisterComponent,
  UserRegisterResultComponent,
  // single pages
  CallbackComponent,
  UserLockComponent,
];
const COMPONENTS_NOROUNT = [];

@NgModule({
  imports: [NzCommentModule,NzEmptyModule,SharedModule, RouteRoutingModule, CanvasWhiteboardModule, PageHeaderModule, NzCardModule, NzTableModule, NzTagModule, NzDrawerModule, NzFormModule, NzInputNumberModule, NzInputModule, NzModalModule, NzAvatarModule, NzIconModule, NzButtonModule, NzTabsModule, NzCheckboxModule, NzDropDownModule, NzRadioModule, NzUploadModule, NzBadgeModule],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT,
    BlocklyComponent,
    ListComponent,
    ProgressComponent,
    WelcomeComponent,

    StatisticsComponent,

    AssessmentComponent,

    CreateComponent,
    AssessmentSuccessComponent,
    AllSceneComponent,

    RemoteControlComponent,
    WhiteboardComponent,
    BlocklyWebrtcComponent,
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class RoutesModule {}
