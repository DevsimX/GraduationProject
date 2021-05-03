import { NgModule } from '@angular/core';
import { SharedModule } from '@shared';

import { LayoutDefaultComponent } from './default/default.component';
import { LayoutFullScreenComponent } from './fullscreen/fullscreen.component';
import { HeaderComponent } from './default/header/header.component';
import { SidebarComponent } from './default/sidebar/sidebar.component';
import { HeaderSearchComponent } from './default/header/components/search.component';
import { HeaderNotifyComponent } from './default/header/components/notify.component';
import { HeaderTaskComponent } from './default/header/components/task.component';
import { HeaderIconComponent } from './default/header/components/icon.component';
import { HeaderFullScreenComponent } from './default/header/components/fullscreen.component';
import { HeaderStorageComponent } from './default/header/components/storage.component';
import { HeaderUserComponent } from './default/header/components/user.component';

import { SettingDrawerComponent } from './default/setting-drawer/setting-drawer.component';
import { SettingDrawerItemComponent } from './default/setting-drawer/setting-drawer-item.component';

const SETTINGDRAWER = [SettingDrawerComponent, SettingDrawerItemComponent];

const COMPONENTS = [
  LayoutDefaultComponent,
  LayoutFullScreenComponent,
  HeaderComponent,
  SidebarComponent,
  ...SETTINGDRAWER
];

const HEADERCOMPONENTS = [
  HeaderSearchComponent,
  HeaderNotifyComponent,
  HeaderTaskComponent,
  HeaderIconComponent,
  HeaderFullScreenComponent,
  HeaderStorageComponent,
  HeaderUserComponent
];

// passport
import { LayoutPassportComponent } from './passport/passport.component';
import {NzDropDownModule} from "ng-zorro-antd/dropdown";
import {NzAvatarModule} from "ng-zorro-antd/avatar";
import {NzSpinModule} from "ng-zorro-antd/spin";
import {NoticeIconModule} from "@delon/abc/notice-icon";
import {NzBadgeModule} from "ng-zorro-antd/badge";
import {NzGridModule} from "ng-zorro-antd/grid";
import {NzIconModule} from "ng-zorro-antd/icon";
import {NzCardModule} from "ng-zorro-antd/card";
import {NzDrawerModule} from "ng-zorro-antd/drawer";
import {NzToolTipModule} from "ng-zorro-antd/tooltip";
import {NzTabsModule} from "ng-zorro-antd/tabs";
import {NzDividerModule} from "ng-zorro-antd/divider";
import {NzSwitchModule} from "ng-zorro-antd/switch";
import {NzInputNumberModule} from "ng-zorro-antd/input-number";

const PASSPORT = [
  LayoutPassportComponent
];

@NgModule({
    imports: [SharedModule, NzDropDownModule, NzAvatarModule, NzSpinModule, NoticeIconModule, NzBadgeModule, NzGridModule, NzIconModule, NzCardModule, NzDrawerModule, NzToolTipModule, NzTabsModule, NzDividerModule, NzSwitchModule, NzInputNumberModule,],
  entryComponents: SETTINGDRAWER,
  declarations: [
    ...COMPONENTS,
    ...HEADERCOMPONENTS,
    ...PASSPORT
  ],
  exports: [
    ...COMPONENTS,
    ...PASSPORT
  ]
})
export class LayoutModule { }
