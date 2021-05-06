import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SimpleGuard } from '@delon/auth';
import { environment } from '@env/environment';
// layout
import { LayoutBasicComponent } from '../layout/basic/basic.component';
import { LayoutPassportComponent } from '../layout/passport/passport.component';
// dashboard pages
import { DashboardComponent } from './dashboard/dashboard.component';

import { BlocklyComponent } from './blockly/blockly.component';

// passport pages
import { UserLoginComponent } from './passport/login/login.component';
import { UserRegisterComponent } from './passport/register/register.component';
import { UserRegisterResultComponent } from './passport/register-result/register-result.component';
// single pages
import { CallbackComponent } from './callback/callback.component';
import { UserLockComponent } from './passport/lock/lock.component';

import { ListComponent } from './list/list.component';
import { ProgressComponent } from './progress/progress.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { AssessmentComponent } from './assessment/assessment.component';
import { CreateComponent } from './create/create.component';
import { AssessmentSuccessComponent } from './assessment/assessmentSucess/assessmentSuccess.component';
import { AllSceneComponent } from './allScene/allScene.component';
import {RemoteControlComponent} from "./remoteControl/remoteControl.component";
import {RemoteControlGuard} from "../auth/remoteControl.guard";
import {LayoutBlankComponent} from "../layout/blank/blank.component";
import {TestPageComponent} from "../test-page/test-page.component";


const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [SimpleGuard],
    canActivateChild: [SimpleGuard],
    children: [

      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome', component: WelcomeComponent, data: { title: '欢迎' } },
      { path: 'exception', loadChildren: () => import('./exception/exception.module').then(m => m.ExceptionModule) },
      { path: 'list', component: ListComponent, data: { title: '场景大厅' } },
      { path: 'progress', component: ProgressComponent, data: { title: '提交记录' } },
      { path: 'test', component: TestPageComponent, data: { title: 'test page' } },

      //教师页面
      { path: 'statistics', component: StatisticsComponent, data: { title: '数据统计' } },
      { path: 'assess/:submit_id', component: AssessmentComponent, data: { title: '作业评阅' } },
      { path: 'create', component: CreateComponent, data: { title: '新建场景' } },
      { path: 'assessRlt', component: AssessmentSuccessComponent, data: { title: '成功' } },
      { path: 'allScene', component: AllSceneComponent, data: { title: '所有场景' } },
    ],
  },
  // Blak Layout 空白布局
  {
    path: 'data-v',
    component: LayoutBlankComponent,
    children: [{ path: '', loadChildren: () => import('./data-v/data-v.module').then((m) => m.DataVModule) }],
  },
  // 全屏布局
  {
    path: 'fullscreen',
    children: [
      { path: 'blockly/:id', component: BlocklyComponent, data: { title: '工作区' } },
    ],
  },
  //远程控制页面
  {
    path: 'remoteControl',
    canActivate:[RemoteControlGuard],
    component: RemoteControlComponent,
    data: {title: '视频通话区'},
  },
  // passport
  {
    path: 'passport',
    component: LayoutPassportComponent,
    children: [
      { path: 'login', component: UserLoginComponent, data: { title: '登录'} },
      { path: 'register', component: UserRegisterComponent, data: { title: '注册' } },
      {
        path: 'register-result',
        component: UserRegisterResultComponent,
        data: { title: '注册结果', titleI18n: 'pro-register-result' },
      },
      { path: 'lock', component: UserLockComponent, data: { title: '锁屏', titleI18n: 'lock' } },
    ],
  },
  // 单页不包裹Layout
  { path: 'callback/:type', component: CallbackComponent },
  { path: '**', redirectTo: 'exception/404' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes, {
        useHash: environment.useHash,
        // NOTICE: If you use `reuse-tab` component and turn on keepingScroll you can set to `disabled`
        // Pls refer to https://ng-alain.com/components/reuse-tab
        scrollPositionRestoration: 'top',
      },
    )],
  exports: [RouterModule],
})
export class RouteRoutingModule {
}
