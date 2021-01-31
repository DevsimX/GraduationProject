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
  imports: [ SharedModule, RouteRoutingModule ],
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
    AllSceneComponent
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class RoutesModule {}
