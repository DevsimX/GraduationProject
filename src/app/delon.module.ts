/**
 * 进一步对基础模块的导入提炼
 * 有关模块注册指导原则请参考：https://ng-alain.com/docs/module
 */
import { NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core';
import { throwIfAlreadyLoaded } from '@core';

import { AlainThemeModule } from '@delon/theme';
import { DelonACLModule } from '@delon/acl';

// #region mock
import { DelonMockModule } from '@delon/mock';
import * as MOCKDATA from '../../_mock';
import { environment } from '@env/environment';
const MOCK_MODULES = !environment.production ? [DelonMockModule.forRoot({ data: MOCKDATA })] : [];
// #endregion

// #region reuse-tab
/**
 * 若需要[路由复用](https://ng-alain.com/components/reuse-tab)需要：
 * 1、增加 `REUSETAB_PROVIDES`
 * 2、在 `src/app/layout/default/default.component.html` 修改：
 *  ```html
 *  <section class="alain-default__content">
 *    <reuse-tab></reuse-tab>
 *    <router-outlet></router-outlet>
 *  </section>
 *  ```
 */
import { RouteReuseStrategy } from '@angular/router';
import { ReuseTabService, ReuseTabStrategy } from '@delon/abc/reuse-tab';
const REUSETAB_PROVIDES = [
  // {
  //   provide: RouteReuseStrategy,
  //   useClass: ReuseTabStrategy,
  //   deps: [ReuseTabService],
  // },
];
// #endregion

// #region global config functions

import {PageHeaderModule} from '@delon/abc/page-header';
export function fnPageHeaderConfig(): PageHeaderModule {
  return {
    ...new PageHeaderModule(),
    homeI18n: 'home',
  };
}

import {DelonAuthModule} from '@delon/auth';

export function fnDelonAuthConfig(): DelonAuthModule {
  return {
    ...new DelonAuthModule(),
    login_url: '/passport/login',
    ignores: [ new RegExp("/users/register"), new RegExp("/users/login") ]
  };
}

// tslint:disable-next-line: no-duplicate-imports
import { STModule } from '@delon/abc/st';
export function fnSTConfig(): STModule {
  return {
    ...new STModule(),
    modal: { size: 'lg' },
  };
}

const GLOBAL_CONFIG_PROVIDES = [
  // TIPS：@delon/abc 有大量的全局配置信息，例如设置所有 `st` 的页码默认为 `20` 行
  { provide: STModule, useFactory: fnSTConfig },
  { provide: PageHeaderModule, useFactory: fnPageHeaderConfig },
  { provide: DelonAuthModule, useFactory: fnDelonAuthConfig },
];

// #endregion

@NgModule({
  imports: [AlainThemeModule.forRoot(), DelonACLModule.forRoot(), ...MOCK_MODULES],
})
export class DelonModule {
  constructor(@Optional() @SkipSelf() parentModule: DelonModule) {
    throwIfAlreadyLoaded(parentModule, 'DelonModule');
  }

  static forRoot(): ModuleWithProviders<any> {
    return {
      ngModule: DelonModule,
      providers: [...REUSETAB_PROVIDES, ...GLOBAL_CONFIG_PROVIDES],
    };
  }
}
