import { Injectable, Injector, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { zip } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MenuService, SettingsService, TitleService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { ACLService } from '@delon/acl';

import { NzIconService } from 'ng-zorro-antd/icon';
import { ICONS_AUTO } from '../../../style-icons-auto';
import { ICONS } from '../../../style-icons';

/**
 * Used for application startup
 * Generally used to get the basic data of the application, like: Menu Data, User Data, etc.
 */
@Injectable()
export class StartupService {
  constructor(
    iconSrv: NzIconService,
    private menuService: MenuService,
    private settingService: SettingsService,
    private aclService: ACLService,
    private titleService: TitleService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
    private httpClient: HttpClient,
    private injector: Injector,
  ) {
    iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
  }

  // mock出部分数据，把比如头像等
  private viaMock(resolve: any, reject: any) {
    const tokenData = this.tokenService.get();

    // if (!tokenData.token) {
    //   this.injector.get(Router).navigateByUrl('/passport/login');
    //   resolve({});
    //   return;
    // }

    const app: any = {
      name: 'Scratch',
      description: `to learn, to code`,
    };

    const user: any = {
      avatar: './assets/tmp/img/avatar.jpg', ...tokenData,
    };

    this.settingService.setApp(app);

    this.settingService.setUser(user);

    this.aclService.setFull(true);

    // Menu data, https://ng-alain.com/theme/menu
    let role = JSON.parse(localStorage.getItem('user')).role;
    if (role === 'teacher') this.menuService.add([
      {
        hideInBreadcrumb: true,
        group: false,
        children: [
          {
            text: '欢迎',
            link: '/welcome',
            icon: { type: 'icon', value: 'rocket' },
          },
          {
            text: '新建场景',
            link: '/create',
            icon: { type: 'icon', value: 'rocket' },
          },
          {
            text: '数据统计',
            link: '/statistics',
            icon: { type: 'icon', value: 'database' },
          },
          {
            text: '我的场景',
            link: '/allScene',
            icon: { type: 'icon', value: 'appstore' },
          },
          {
            text: '场景大厅',
            link: '/list',
            icon: { type: 'icon', value: 'appstore' },
          },
        ],
      }],
    );
    else this.menuService.add([
      {
        hideInBreadcrumb: true,
        group: false,
        children: [
          {
            text: '欢迎',
            link: '/welcome',
            icon: { type: 'icon', value: 'rocket' },
          },

          {
            text: '场景大厅',
            link: '/list',
            icon: { type: 'icon', value: 'appstore' },
          },
          {
            text: '提交记录',
            link: '/progress',
            icon: { type: 'icon', value: 'database' },
          },
        ],
      },
    ]);
    // Can be set page suffix title, https://ng-alain.com/theme/title
    this.titleService.suffix = app.name;
    resolve({});
  }

  load(): Promise<any> {
    // only works with promises
    // https://github.com/angular/angular/issues/15088
    return new Promise((resolve, reject) => {
      // http
      // this.viaHttp(resolve, reject);
      // mock：请勿在生产环境中这么使用，viaMock 单纯只是为了模拟一些数据使脚手架一开始能正常运行
      this.viaMock(resolve, reject);

    });
  }
}
