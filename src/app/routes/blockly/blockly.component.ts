import {Component, Inject, OnInit} from '@angular/core';

import {blockly_options} from 'src/assets/blockly/blockly_options.js';

import {Crypto} from 'src/assets/crypto/crypto';
import {SceneType, SceneService} from '../../services/scene.service';
import {ActivatedRoute} from '@angular/router';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {NzModalService} from "ng-zorro-antd/modal";

import {CanvasWhiteboardComponent} from "ng2-canvas-whiteboard";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzTabsCanDeactivateFn} from "ng-zorro-antd/tabs";
import {Observable} from "rxjs";
import * as EventEmitter from "events";
import Position from '../../../assets/blockly/Position.js';
import {WebrtcService} from "../../services/webrtcServices/webrtc.service";
import {WebrtcUtilService} from "../../services/webrtcServices/webrtc-util.service";

declare var interpreter: any;
declare var Blockly: any;

interface CryptoType {
  encode?: any;
  decode?: any;
}

interface ObjectsType {
  moveObject?: any,
  backgroundImg?: string
}

interface HistoryResponseType {
  msg?: string,
  data?: { history: any, scene: any }
}

interface cryptoType {
  encode?: any;
  decode?: any;
}

interface SceneResponseType {
  list?: SceneType[];
}

interface MyObjectType {
  pictures?: any[],
  x?: number,
  y?: number,
  rotation?: number,
  p?: number,
  hide?: Boolean
}

interface WorkspaceParams {
  listener: EventEmitter,
  workspaceId: string,
  lastSync: number,
  inProgress: any[],
  notSent: any[],
  activeChanges: any[],
  writeInProgress: boolean,
  counter: number,
  serverEvents: any[],
  updateInProgress: boolean,
}

interface UserDataParams {
  colours: any[],
}

@Component({
  selector: 'app-blockly',
  templateUrl: './blockly.component.html',
  styles: [],
  styleUrls: ['./blockly.component.less'],
  providers: [],
  viewProviders: [CanvasWhiteboardComponent],
})
export class BlocklyComponent implements OnInit {
  tabs = [];
  selectedIndex = 0;
  workspace = undefined;
  objects: any = {moveObject: {}}; // 运行过程中的objects
  oldObjects: any = {moveObject: {}}; // 场景原objects
  cxt = undefined;
  run = false;
  cWidth = 0;
  cHeight = 0;
  h = undefined;
  levelIndex: number = 1;
  scene: SceneType = undefined;
  level: string = undefined;
  roomID: string = "";
  sceneID = undefined;
  check_way = 0;
  isVisible = false;
  isOkLoading = false;
  order = 0;
  drawerVisible = false;

  // workspace params
  workspaceParams: WorkspaceParams = {
    workspaceId: undefined,
    lastSync: 0,
    inProgress: [],
    notSent: [],
    activeChanges: [],
    writeInProgress: false,
    counter: 0,
    serverEvents: [],
    updateInProgress: false,
    listener: new EventEmitter(),
  }

  // user data params
  userDataParams: UserDataParams = {
    colours: [
      '#fcba03', '#03fc20', '#03f0fc', '#035efc', '#5603fc', '#fc03d2'],
  }

  // 创建场景
  movePictures: any[][] = []; // 可移动角色图片集
  otherPictures: any[][] = []; // 其他角色图片集
  bgPictures: any[][] = []; // 背景图片角色集

  moveObjectSelectedIndex: number = -1; // 可移动角色选中者索引，用来产生唯一性
  bgSelectedIndex: number = -1;

  coordinate1: string = '';
  coordinate2: string = '';

  x1: number = 0;
  y1: number = 0;
  x2: number = 0;
  y2: number = 0;

  // 新手引导
  helpIsVisible = false;
  currentIndex = 0;
  allMsg = [
    {msg: '选择一个积木，拖动到桌面上', img: 'help1.gif'},
    {msg: '选择一个动作，拖到插槽中', img: 'help2.gif'},
    {msg: '修改数值', img: 'help3.gif'},
    {msg: '顺序', img: 'help4.gif'},
    {msg: '删除', img: 'help5.gif'},
    {msg: '热线求助：创建房间与关闭摄像头', img: 'help6-n.gif'}
  ];
  buttonMsg = '下一步';

  constructor(
    private sceneService: SceneService,
    private route: ActivatedRoute,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private webrtcService: WebrtcService,
    public webrtcUtilService: WebrtcUtilService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
  ) {
  }


  ngAfterViewInit(): void {
    this.initBlockly();
    this.initCanvas();
  }

  ngOnInit(): void {
    let crypto: cryptoType = new Crypto();
    let that = this;

    this.webrtcService.connectedSubject.subscribe(async function (v) {
      await that.syncWithServer();
      await that.workspaceSentToServer();
      that.workspace.addChangeListener((event) => {
        if (event.type === Blockly.Events.SELECTED ||
          (event.type === Blockly.Events.CHANGE && event.element === 'field')) {
          that.handleEvent(event);
        }
        if (event.isUiEvent) {
          return;
        }
        that.workspaceParams.activeChanges.push(event);
        if (!Blockly.Events.getGroup()) {
          that.flushEvents();
        }
      });
    })

    // this.initCanvas();
    // 先获得场景编号，然后根据当前的模式判断应该执行的内容
    this.route.params.subscribe(function (data) {
      that.sceneID = data.id;

      that.route.queryParams.subscribe((query) => {
        if (!query.order) {
          that.order = 0;
          that.normalPlay();
          that.setTitle("开始学习");
          return;
        }
        let order = crypto.decode(query.order);
        switch (order.msg) {
          case "create_scene":
            that.order = 1;
            that.createScene();
            that.setTitle("创建场景");
            that.addScenePictures();
            that.addMovePictures();
            that.addOtherPictures();
            break;
          case "load_history":
            that.order = 2;
            that.loadHistory();
            that.setTitle("继续学习");
            break;
          case "load_submit":
            that.order = 3;
            that.loadSubmit(order.submit_id);
            that.setTitle("提交内容查看");
            break;
          case "load_create":
            that.order = 4;
            that.loadCreate();
            that.setTitle("查看所创场景");
            break;
        }
      });
    });
  }

  setTitle(str) {
    window.onload = function () {
      document.title = str + "-Scratch";
    }
  }

  loadHistory() {
    let that = this;
    that.sceneService.getHistory(that.tokenService.get().id)
      .subscribe((res: HistoryResponseType) => {
        if (res.data.history !== {} && res.data.scene !== {}) {
          that.scene = res.data.scene;
          that.levelIndex = parseInt(res.data.history.level);
          that.level = eval("that.scene.l" + that.levelIndex);
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(res.data.history.script), that.workspace);
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          that.addObjectsToCanvas(objects);
        } else {
          that.notification.error('加载失败', '还不存在任何历史记录', {nzDuration: 2000});
          that.normalPlay()
        }
      }, error => {
        that.notification.error('加载失败', '还不存在任何历史记录', {nzDuration: 2000});
      });
  }

  loadCreate() {
    let id = this.sceneID;
    let that = this;
    that.sceneService.getScene(id)
      .subscribe((res: SceneResponseType) => {
        if (res.list && res.list.length) {
          that.scene = res.list[0];
          that.levelIndex = 1;
          that.level = that.scene.l1;
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(that.scene.script), that.workspace);
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          that.addObjectsToCanvas(objects);
        }
      });
  }

  loadSubmit(submit_id) {
    let that = this;
    that.sceneService.getSubmit(submit_id)
      .subscribe((res: any) => {
        if (res.msg === 'ok') {
          that.scene = res.scene;
          that.levelIndex = parseInt(res.history.level);
          that.level = eval("that.scene.l" + that.levelIndex);
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(res.history.script), that.workspace);
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          that.addObjectsToCanvas(objects);
        } else {
          that.notification.error('加载失败', '不存在该提交记录', {nzDuration: 2000});
          that.normalPlay()
        }
      }, error => {
        that.notification.error('加载失败', '不存在该提交记录', {nzDuration: 2000});
        that.normalPlay()
      })
  }

  createScene() {
    let id = this.sceneID;
    let that = this;
    that.sceneService.getScene(id)
      .subscribe((res: SceneResponseType) => {
        if (res.list && res.list.length) {
          that.scene = res.list[0];
          that.check_way = res.list[0].check_way;
          that.levelIndex = 1;
          that.level = that.scene.l1;
        }
      });
  }

  normalPlay() {
    let id = this.sceneID;
    let that = this;
    that.sceneService.getScene(id)
      .subscribe((res: SceneResponseType) => {
        if (res.list && res.list.length) {
          that.scene = res.list[0];
          that.levelIndex = 1;
          that.level = that.scene.l1;
          let objects = JSON.parse(that.scene.objects) as ObjectsType;
          // console.log(res.list[0]);
          that.addObjectsToCanvas(objects);
        }
      });
  }

  initCanvas() {
    //canvas
    let cnv = window.document.getElementById('cnvMain') as HTMLCanvasElement;
    this.cWidth = cnv.width;
    this.cHeight = cnv.height;
    this.cxt = cnv.getContext('2d');
    this.cxt.translate(this.cWidth / 2, this.cHeight / 2); // 坐标移到正中心
    let that = this;
    window.onbeforeunload = function (event) {
      if ([0, 2].indexOf(that.order) !== -1) {
        that.saveHistory();
        event.returnValue = "确定离开当前页面吗？";
      }
    };
  }

  initBlockly() {
    //blockly
    const blocklyDiv = document.getElementById('blocklyDiv');
    this.workspace = Blockly.inject(blocklyDiv, blockly_options);
  }

  addObjectsToCanvas(objects) {
    let baseUrl = 'https://121.4.43.229:6969/';
    if (objects.backgroundImg) {
      let url = objects.backgroundImg.indexOf('http') !== -1 ? objects.backgroundImg : (baseUrl + objects.backgroundImg);
      document.getElementById("background").style.backgroundImage = "url('" + url + "')";
      document.getElementById("background").style.backgroundSize = 'cover';
    }
    this.oldObjects = objects;
    let that = this;
    Object.keys(this.oldObjects).forEach(key => {
      if (typeof (this.oldObjects[key]) === 'object') {
        this.objects[key] = {...this.oldObjects[key]}
      }
    });
    this.initImgResource();
    this.notification.success(`提示`, '资源加载中', {nzDuration: 3000});
    setTimeout(function () {
      that.drawObjects(that.cxt);
    }, 3000);
  }

  similar(s, t, f) {
    if (!s || !t) {
      return 0
    }
    var l = s.length > t.length ? s.length : t.length;
    var n = s.length;
    var m = t.length;
    var d = [];
    f = f || 3;
    var min = function (a, b, c) {
      return a < b ? (a < c ? a : c) : (b < c ? b : c)
    };
    var i, j, si, tj, cost;
    if (n === 0) return m;
    if (m === 0) return n;
    for (i = 0; i <= n; i++) {
      d[i] = []
      d[i][0] = i
    }
    for (j = 0; j <= m; j++) {
      d[0][j] = j
    }
    for (i = 1; i <= n; i++) {
      si = s.charAt(i - 1);
      for (j = 1; j <= m; j++) {
        tj = t.charAt(j - 1);
        if (si === tj) {
          cost = 0
        } else {
          cost = 1
        }
        d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      }
    }
    let res = (1 - d[n][m] / l);
    return res.toFixed(f);
  }

  // 动画相关
  initImgResource(object = undefined) {
    if (object && object.pictures) {
      object.pictures.forEach(p => {
        if (p.img) {
          return;
        }
        let img = new Image();
        img.src = p.path;
        img.onload = function () {
          p.img = img;
        };
      });
    } else {
      Object.keys(this.objects).forEach(item => {
        if (typeof this.objects[item] === 'object' && this.objects[item] && this.objects[item].pictures) {
          this.objects[item].pictures.forEach(p => {
            if (p.img) {
              return;
            }
            let img = new Image();
            img.src = p.path;
            img.onload = function () {
              p.img = img;
            };
          });
        }
      })
    }
  }

  showObjects() {
    Object.keys(this.objects).forEach(key => {
      if (typeof this.objects[key] === 'object') {
        this.notification.blank(`对象 ${key}`, ` x: ${this.objects[key].x} y: ${this.objects[key].x} ${this.objects[key].hide ? '已隐藏' : '显示'}`);
      }
    });

  }

  draw(cxt, object) {
    if (!object || typeof object !== 'object' || object.p < 0 || !object.pictures || object.p >= object.pictures.length || object.hide) {
      return;
    }
    let img = object.pictures[object.p].img;
    let theta = object.rotation * Math.PI / 180;
    cxt.rotate(-theta);
    let x = object.x * Math.cos(theta) + object.y * Math.sin(theta);
    let y = -object.y * Math.cos(theta) + object.x * Math.sin(theta);
    cxt.translate(-0.8 * img.width / 2, -0.8 * img.height / 2);
    cxt.drawImage(object.pictures[object.p].img, x, y, 0.8 * img.width, 0.8 * img.height);
    cxt.translate(0.8 * img.width / 2, 0.8 * img.height / 2);
    cxt.rotate(theta);
  }

  drawObjects(cxt) {
    Object.keys(this.objects).forEach(key => {
      this.draw(cxt, this.objects[key]);
    });
  }

  clearCnv(cxt) {
    cxt.translate(-this.cWidth / 2, -this.cHeight / 2);
    cxt.clearRect(0, 0, this.cWidth, this.cHeight);
    cxt.translate(this.cWidth / 2, this.cHeight / 2);
  }

  render() {
    this.clearCnv(this.cxt);
    this.drawObjects(this.cxt);
  }

  runCode(): void {
    if (this.run) {
      return;
    }
    this.run = true;
    let that = this;
    let code = (Blockly as any).JavaScript.workspaceToCode(this.workspace);
    interpreter.setObjects({...this.objects, show: this.notification, cWidth: this.cWidth, cHeight: this.cHeight});
    this.h = setInterval(function () {
      if (interpreter.next()) {
        interpreter.run();
        that.render();
      } else {
        clearInterval(that.h);
        that.run = false;
        interpreter.steps = [];
        interpreter.stepIndex = 0;
      }
    }, 30);
  }

  stopCode(): void {
    clearInterval(this.h);
    this.run = false;
    interpreter.steps = [];
    interpreter.stepIndex = 0;
  }

  clear(): void {
    clearInterval(this.h);
    this.run = false;
    interpreter.steps = [];
    interpreter.stepIndex = 0;
    this.objects = {};
    Object.keys(this.oldObjects).forEach(key => {
      if (typeof (this.oldObjects[key]) === 'object') {
        this.objects[key] = {...this.oldObjects[key]}
      }
    });
    this.clearCnv(this.cxt);
    this.drawObjects(this.cxt);
    interpreter.setObjects({...this.objects, show: this.notification, cWidth: this.cWidth, cHeight: this.cHeight});
  }

  // 创建场景相关
  uploadObjects() {
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
  }


  addScenePictures() {
    let baseUrl = 'https://121.4.43.229:6969/background/';
    let bg = ['Underwater.png', 'Start.png', 'Soccer.png', 'Mountain.png', 'Galaxy.png', 'Desert.png', 'Castle.png', 'Boardwalk.png'];
    this.bgPictures = [];
    bg.forEach((item, index) => {
      if (!(index % 3)) {
        this.bgPictures.push([])
      }
      this.bgPictures[Math.floor(index / 3)].push({src: baseUrl + item, title: item.split('.')[0]})
    });
  }

  addMovePictures() {
    let baseUrl = 'https://121.4.43.229:6969/';
    let bg = ['blockly_zebra', 'blockly_fish', 'blockly_cat2', 'blockly_cat', 'blockly_basketball', 'blockly_arrow', 'blockly_apple'];
    this.movePictures = [];
    bg.forEach((item, index) => {
      if (!(index % 4)) {
        this.movePictures.push([])
      }
      this.movePictures[Math.floor(index / 4)].push({src: baseUrl + item + '/p1.svg', title: item.split('_')[1]})
    })
  }

  addOtherPictures() {
    let context = ['blockly_zebra', 'blockly_fish', 'blockly_cat2', 'blockly_cat', 'blockly_basketball', 'blockly_arrow', 'blockly_apple'];
    let baseUrl = 'https://121.4.43.229:6969/';
    this.otherPictures = [];
    context.forEach((item, index) => {
      if (!(index % 4)) {
        this.otherPictures.push([])
      }
      this.otherPictures[Math.floor(index / 4)].push({src: baseUrl + item + '/p1.svg', title: item.split('_')[1]})
    })
  }

  chooseBackgroundImg(i, j) {
    this.bgSelectedIndex = 3 * i + j;
    document.getElementById("background").style.backgroundImage = "url('" + this.bgPictures[i][j].src + "')";
    document.getElementById("background").style.backgroundSize = 'cover';
    this.objects.backgroundImg = this.bgPictures[i][j].src;
    this.oldObjects.backgroundImg = this.bgPictures[i][j].src;
  }

  chooseObject(i, j) {
    this.moveObjectSelectedIndex = 4 * i + j;
    let o = {
      x: 0,
      y: 0,
      pictures: [{path: this.movePictures[i][j].src}, {path: this.movePictures[i][j].src.split('1.svg')[0] + '2.svg'}],
      p: 0,
      rotation: 0,
      hide: false
    };

    this.objects.moveObject = o;
    this.oldObjects.moveObject = {...o};
    this.coordinate1 = this.movePictures[i][j].src.split('blockly_')[1].split('/')[0];

    this.initImgResource(o);
    let that = this;
    this.clearCnv(this.cxt);


    setTimeout(function () {
      Object.keys(that.objects).forEach(key => {
        that.draw(that.cxt, that.objects[key]);
      });
    }, 1000);
  }

  // 点击其他角色的图片
  chooseOtherObject(i, j) {
    // 图片
    let picture = this.movePictures[i][j];
    // 对象名
    let name = picture.src.split('blockly_')[1].split('/')[0];
    if (this.objects[name]) {
      // 点击第二次表示取消选择
      this.otherPictures[i][j].selected = false;
      this.objects[name] = undefined;
      this.oldObjects[name] = undefined;
      this.coordinate2 = '';
      this.x2 = 0;
      this.y2 = 0;
      this.clearCnv(this.cxt);
      Object.keys(this.objects).forEach(key => {
        this.draw(this.cxt, this.objects[key]);
      });
    } else {
      // 选中
      this.otherPictures[i][j].selected = true;

      // 构造对象
      let o = {x: 0, y: 0, pictures: [], p: 0, rotation: 0, hide: false};
      o.pictures = [{path: this.otherPictures[i][j].src}, {path: this.otherPictures[i][j].src.split('1.svg')[0] + '2.svg'}];
      this.objects[name] = o;
      this.oldObjects[name] = {...o};
      // 图像资源预加载
      this.initImgResource(o);
      // 坐标框初始化
      this.coordinate2 = name;
      this.x2 = this.objects[name].x;
      this.y2 = this.objects[name].y;

      // 重绘所有图片
      let that = this;
      this.clearCnv(this.cxt);
      setTimeout(function () {
        Object.keys(that.objects).forEach(key => {
          that.draw(that.cxt, that.objects[key]);
        });
      }, 1000);
    }
  }

  // 确认对象的位置
  confirmCoordinate(coordinateName, x, y, kind) {
    if (!coordinateName || (kind && !this.objects.moveObject) || (!kind && !this.objects[coordinateName])) {
      return;
    }
    if (kind) {
      this.objects.moveObject.x = x;
      this.objects.moveObject.y = y;
      this.oldObjects.moveObject.x = x;
      this.oldObjects.moveObject.y = y;
    } else {
      this.objects[coordinateName].x = x;
      this.objects[coordinateName].y = y;
      this.oldObjects[coordinateName].x = x;
      this.oldObjects[coordinateName].y = y;
    }
    this.clearCnv(this.cxt);
    // 重绘所有图片
    Object.keys(this.objects).forEach(key => {
      this.draw(this.cxt, this.objects[key]);
    });
  }

  setCoordinate2(i, j) {
    let name = this.otherPictures[i][j].src.split('blockly_')[1].split('/')[0];
    if (this.objects[name]) {
      this.coordinate2 = name;
      this.x2 = this.objects[name].x;
      this.y2 = this.objects[name].y;
    }
  }

  reRender() {
    this.clearCnv(this.cxt);
    // 重绘所有图片
    Object.keys(this.objects).forEach(key => {
      this.draw(this.cxt, this.objects[key]);
    });
  }

  // 场景切换相关
  nextLevel() {
    if (this.levelIndex >= this.scene.level_number) {
      return;
    }
    this.levelIndex++;
    this.level = eval("this.scene.l" + this.levelIndex);
  }

  prevLevel() {
    if (this.levelIndex <= 1) {
      return;
    }
    this.levelIndex--;
    this.level = eval("this.scene.l" + this.levelIndex);
  }

  // 提交场景，模态框相关
  handleCancel() {
    this.isVisible = false;
    this.isOkLoading = false;
  }

  handleOk(): void {
    if (this.order === 3) {
      this.isVisible = false;
      this.isOkLoading = false;
      return;
    }
    let that = this;
    this.isOkLoading = true;
    var xml = Blockly.Xml.workspaceToDom(this.workspace);
    var xml_text = Blockly.Xml.domToText(xml);
    let observableObject = undefined;
    if (this.order === 1) { // 创建场景时提交的数据
      if (!this.oldObjects.moveObject || !this.oldObjects.moveObject.pictures || !this.oldObjects.moveObject.pictures.length) {
        this.notification.error('失败', '必须设置可移动对象');
        this.isVisible = false;
        this.isOkLoading = false;
        return;
      }
      if (!this.check_way && !(Blockly as any).JavaScript.workspaceToCode(this.workspace)) {
        this.notification.error('失败', '机器核定场景必须搭建积木');
        this.isVisible = false;
        this.isOkLoading = false;
        return;
      }
      let submitObjects: any = {};
      Object.keys(this.oldObjects).forEach(key => {
        if (this.oldObjects[key]) {
          if (typeof this.oldObjects[key] === 'object') {
            let pictures = [{path: ''}, {path: ''}];
            pictures[0].path = this.oldObjects[key].pictures[0].path;
            pictures[1].path = this.oldObjects[key].pictures[1].path;
            submitObjects[key] = {...this.oldObjects[key], pictures};
          } else {
            submitObjects[key] = this.oldObjects[key];
          }

        }
      });
      observableObject = this.sceneService.updateScene({
        scene_id: parseInt(that.sceneID),
        script: xml_text,
        objects: JSON.stringify(submitObjects),
        picture: submitObjects.backgroundImg ? submitObjects.backgroundImg : ''
      });
    } else {
      // 学习场景时使用
      let score = 0;
      let result = '';
      if (!that.scene.check_way) {
        score = parseInt('' + this.similar(this.handleScript(xml_text), this.handleScript(this.scene.script), 0) * 100);
        if (score > 90) {
          result = '机器核定优秀';
        } else if (score > 80) {
          result = '机器核定良好';
        } else if (score > 60) {
          result = '机器核定及格';
        } else {
          result = '机器核定不及格';
        }
      }
      observableObject = this.sceneService.submit({
        scene_id: parseInt(that.sceneID),
        student_id: that.tokenService.get().id,
        script: xml_text,
        objects: JSON.stringify(that.scene.objects),
        level: that.levelIndex,
        score: score,
        result: result,
        check_way: that.scene.check_way
      });
    }
    observableObject.subscribe((res: any) => {
      this.isVisible = false;
      this.isOkLoading = false;
      if (res.msg === 'ok') {
        that.notification.success('成功', '提交成功');
      } else {
        that.notification.error('失败', '提交失败，重复提交');
      }
    }, error => {
      this.isVisible = false;
      this.isOkLoading = false;
      that.notification.error('失败', '提交失败，重复提交');
    })
  }

  // 处理掉script中的id部分
  handleScript(str) {
    let result = '';
    while (str.indexOf(' id="') !== -1) {
      result += str.substring(0, str.indexOf(' id="'));
      str = str.substring(str.indexOf('"', str.indexOf(' id="') + 5) + 1);
    }
    result += str;
    let xIndex = result.indexOf(' x="');
    if (xIndex !== -1) {
      result = result.substring(0, xIndex) + result.substring(result.indexOf('"', xIndex + 4) + 1);
    }

    let yIndex = result.indexOf(' y="');
    if (yIndex !== -1) {
      result = result.substring(0, yIndex) + result.substring(result.indexOf('"', yIndex + 4) + 1);
    }
    return result;
  }

  submit() {
    if (this.isVisible) {
      return;
    }
    this.isVisible = true;
  }

  saveHistory() {
    let that = this;
    var xml = Blockly.Xml.workspaceToDom(this.workspace);
    var xml_text = Blockly.Xml.domToText(xml);
    if (xml_text === "<xml xmlns=\"https://developers.google.com/blockly/xml\"></xml>") {
      return;
    }
    this.sceneService.saveHistory({
      scene_id: parseInt(that.sceneID),
      user_id: that.tokenService.get().id,
      script: xml_text,
      objects: that.scene.objects,
      level: that.levelIndex
    }).subscribe(res => {
      console.log('保存历史记录', res);
    });
  }

  // 新手引导
  handleHelpOk() {
    if (this.currentIndex != this.allMsg.length - 1) {
      this.currentIndex++;
      if (this.currentIndex == this.allMsg.length - 1) {
        this.buttonMsg = '完成';
      }
    } else {
      this.helpIsVisible = false;
    }

  }

  handleHelpCancel() {
    this.helpIsVisible = false;
  }

  show() {
    this.buttonMsg = '下一步';
    this.currentIndex = 0;
    this.helpIsVisible = true;
  }

  /*
  workspace sync and update to server part
   */


  async syncWithServer() {
    this.workspaceParams.workspaceId = this.workspace.id;
    this.workspaceParams.listener.on('runEvents', (eventQueue) => {
      this.runEvents(eventQueue);
    });

    const snapshot = await this.getSnapShot();
    // @ts-ignore
    Blockly.Xml.domToWorkspace(snapshot.xml, this.workspace);

    // @ts-ignore
    this.workspaceParams.lastSync = snapshot.serverId;

    // Run any events that may have happened while loading the workspace.
    const events = await this.getEvents(this.workspaceParams.lastSync)
    await this.addServerEvents(events);

    if (this.getBroadcast) {
      this.getBroadcast(this.addServerEvents.bind(this))
    } else {
      await this.pollServer();
    }
  }

  flushEvents() {
    this.workspaceParams.notSent = this.workspaceParams.notSent.concat(this.workspaceParams.activeChanges);
    this.workspaceParams.activeChanges = [];
    this.updateServer().then(r => {});
  };

  async updateServer() {
    if (this.workspaceParams.writeInProgress || this.workspaceParams.notSent.length == 0) {
      return;
    }
    this.workspaceParams.writeInProgress = true;
    while (this.workspaceParams.notSent.length > 0) {
      await this.writeToDatabase_();
    }
    this.workspaceParams.writeInProgress = false;
  };

  async writeToDatabase_() {
    this.beginWrite();
    try {
      await this.writeEvents(this.workspaceParams.inProgress[this.workspaceParams.inProgress.length - 1]);
      this.endWrite(true);
    } catch {
      this.endWrite(false);
      throw Error('Failed to write to database.');
    }
  };

  beginWrite() {
    this.workspaceParams.writeInProgress = true;
    this.workspaceParams.inProgress.push({
      workspaceId: this.workspaceParams.workspaceId,
      entryNumber: this.workspaceParams.counter,
      events: Blockly.Events.filter(this.workspaceParams.notSent, true),
    });
    this.workspaceParams.counter += 1;
    this.workspaceParams.notSent = [];
  };

  async writeEvents(entry) {
    const entryJson = {
      workspaceId: entry.workspaceId,
      entryNumber: entry.entryNumber,
      events: entry.events.map((event) => event.toJson())
    };
    return new Promise((resolve, reject) => {
      this.webrtcUtilService.socket.emit('addEvents', entryJson, () => {
        resolve(null);
      });
    });
  }

  endWrite(success) {
    if (!success) {
      this.workspaceParams.notSent = this.workspaceParams.inProgress[0].events.concat(this.workspaceParams.notSent);
      this.workspaceParams.inProgress = [];
      this.workspaceParams.counter -= 1;
    }
    this.workspaceParams.writeInProgress = false;
  };

  async getSnapShot() {
    return new Promise(
      (resolve, reject) => {
        this.webrtcUtilService.socket.emit('getSnapshot', (snapshot) => {
          snapshot.xml = Blockly.Xml.textToDom(snapshot.xml);
          resolve(snapshot);
        });
      }
    )
  }

  async getEvents(serverId: number) {
    return new Promise((resolve, reject) => {
      this.webrtcUtilService.socket.emit('getEvents', serverId, (entries) => {
        entries.forEach((entry) => {
          entry.events = entry.events.map((entry) => {
            return Blockly.Events.fromJson(entry, Blockly.getMainWorkspace());
          });
        });
        resolve(entries);
      });
    });
  }

  getBroadcast(callback) {
    this.webrtcUtilService.socket.on('broadcastEvents', (entries) => {
      entries.forEach((entry) => {
        entry.events = entry.events.map((entry) => {
          return Blockly.Events.fromJson(entry, Blockly.getMainWorkspace());
        });
      });
      callback(entries);
    });
  }

  runEvents(eventQueue) {
    eventQueue.forEach((workspaceAction) => {
      Blockly.Events.disable();
      workspaceAction.event.run(workspaceAction.forward);
      Blockly.Events.enable();
    });
  };

  async addServerEvents(newServerEvents) {
    if (newServerEvents.length == 0) {
      return;
    }
    if (newServerEvents[0].serverId != this.workspaceParams.lastSync + 1) {
      newServerEvents = await this.queryDatabase();
    }
    this.workspaceParams.lastSync = newServerEvents[newServerEvents.length - 1].serverId;
    this.workspaceParams.serverEvents.push.apply(this.workspaceParams.serverEvents, newServerEvents);
    await this.updateWorkspace();
  }

  async queryDatabase() {
    try {
      return await this.getEvents(this.workspaceParams.lastSync);
    } catch {
      return [];
    }
  };

  async updateWorkspace() {
    if (this.workspaceParams.updateInProgress || this.workspaceParams.serverEvents.length == 0) {
      return;
    }
    this.workspaceParams.updateInProgress = true;
    while (this.workspaceParams.serverEvents.length > 0) {
      const newServerEvents = this.workspaceParams.serverEvents;
      this.workspaceParams.serverEvents = [];
      const eventQueue = await this.processQueryResults(newServerEvents);
      this.workspaceParams.updateInProgress = false;
      this.workspaceParams.listener.emit('runEvents', eventQueue);
    }
  };

  processQueryResults(entries) {
    const eventQueue = [];

    if (entries.length == 0) {
      return eventQueue;
    }

    this.workspaceParams.lastSync = entries[entries.length - 1].serverId;

    // No local changes.
    if (this.workspaceParams.notSent.length == 0 && this.workspaceParams.inProgress.length == 0) {
      entries.forEach((entry) => {
        eventQueue.push.apply(
          eventQueue, this.createWorkspaceActions(entry.events, true));
      });
      return eventQueue;
    }

    // Common root, remove common events from server events.
    if (this.workspaceParams.inProgress.length > 0
      && entries[0].workspaceId == this.workspaceParams.workspaceId
      && entries[0].entryNumber == this.workspaceParams.inProgress[0].entryNumber) {
      entries.shift();
      this.workspaceParams.inProgress = [];
    }

    if (entries.length > 0) {
      // Undo local events.
      eventQueue.push.apply(
        eventQueue,
        this.createWorkspaceActions(this.workspaceParams.notSent.slice().reverse(), false));
      if (this.workspaceParams.inProgress.length > 0) {
        this.workspaceParams.inProgress.slice().reverse().forEach((entry) => {
          eventQueue.push.apply(eventQueue, this.createWorkspaceActions(
            entry.events.slice().reverse(), false));
        });
      }
      // Apply server events.
      entries.forEach((entry) => {
        if (this.workspaceParams.inProgress.length > 0
          && entry.workspaceId == this.workspaceParams.inProgress[0].workspaceId
          && entry.entryNumber == this.workspaceParams.inProgress[0].entryNumber) {
          eventQueue.push.apply(
            eventQueue,
            this.createWorkspaceActions(this.workspaceParams.inProgress[0].events, true));
          this.workspaceParams.inProgress.shift();
        } else {
          eventQueue.push.apply(
            eventQueue, this.createWorkspaceActions(entry.events, true));
        }
      });
      // Reapply remaining local changes.
      if (this.workspaceParams.inProgress.length > 0) {
        eventQueue.push.apply(
          eventQueue,
          this.createWorkspaceActions(this.workspaceParams.inProgress[0].events, true));
      }
      eventQueue.push.apply(
        eventQueue, this.createWorkspaceActions(this.workspaceParams.notSent, true));
    }
    return eventQueue;
  };

  createWorkspaceActions(events, forward) {
    const eventQueue = [];
    events.forEach((event) => {
      eventQueue.push({
        event: event,
        forward: forward
      });
    });
    return eventQueue;
  };

  async pollServer() {
    const entries = await this.queryDatabase();
    await this.addServerEvents(entries);
    setTimeout(() => {
      this.pollServer()
    }, 5000);
  };


  /*
  user data handle parts
   */

  async workspaceSentToServer() {
    await this.connectUser(this.workspaceParams.workspaceId);
    const positionUpdates = await this.getPositionUpdates(null);
    // @ts-ignore
    positionUpdates.forEach((positionUpdate) => {
      this.createMarker_(positionUpdate);
    });
    if (this.getBroadcastPositionUpdates) {
      await this.getBroadcastPositionUpdates(this.updateMarkerPositions_.bind(this));
    } else {
      await this.pollServer_();
    }
    if (this.getUserDisconnects) {
      this.getUserDisconnects(this.disposeMarker_.bind(this));
    }
  }

  async handleEvent(event) {
    const position = Position.fromEvent(event);
    await this.sendPositionUpdate({
      workspaceId: this.workspaceParams.workspaceId,
      position: position
    });
  };

  async pollServer_() {
    const positionUpdates = await this.getPositionUpdates(null);
    await this.updateMarkerPositions_(positionUpdates);
    setTimeout(() => {
      this.pollServer_();
    }, 5000)
  };

  getWorkspace_() {
    return Blockly.Workspace.getById(this.workspaceParams.workspaceId);
  };

  getMarkerManager_() {
    return this.getWorkspace_() ?
      this.getWorkspace_().getMarkerManager() : null;
  };

  getColour_() {
    const colour = this.userDataParams.colours.shift();
    this.userDataParams.colours.push(colour);
    return colour;
  };

  createMarker_(positionUpdate) {
    if (!this.getMarkerManager_()) {
      throw Error('Cannot create a Marker without Blockly MarkerManager.');
    }
    const position = positionUpdate.position;
    const marker = position.toMarker(this.getWorkspace_());
    marker.colour = this.getColour_();
    this.getMarkerManager_().registerMarker(positionUpdate.workspaceId, marker)
    marker.setCurNode(position.createNode(this.getWorkspace_()));
    return marker;
  };

  disposeMarker_(workspaceId) {
    if (!this.getMarkerManager_()) {
      throw Error('Cannot dispose of a Marker without Blockly MarkerManager.');
    }
    try {
      this.getMarkerManager_().unregisterMarker(workspaceId);
    } catch {

    }
  };

  getMarker(workspaceId) {
    return this.getMarkerManager_() ?
      this.getMarkerManager_().getMarker(workspaceId) : null;
  };

  async updateMarkerPositions_(positionUpdates) {
    const filteredPositionUpdates = positionUpdates.filter(
      positionUpdate => positionUpdate.workspaceId != this.workspaceParams.workspaceId);
    filteredPositionUpdates.forEach((positionUpdate) => {
      const position = positionUpdate.position;
      const node = position.createNode(this.getWorkspace_());
      if (this.getMarker(positionUpdate.workspaceId)) {
        this.getMarker(positionUpdate.workspaceId).setCurNode(node);
      } else {
        this.createMarker_(positionUpdate).setCurNode(node);
      }
    });
  };

  async getPositionUpdates(workspaceId) {
    return new Promise((resolve, reject) => {
      this.webrtcUtilService.socket.emit('getPositionUpdates', workspaceId, (positionUpdates) => {
        positionUpdates.forEach((positionUpdate) => {
          positionUpdate.position = Position.fromJson(positionUpdate.position);
        });
        resolve(positionUpdates);
      });
    });
  }

  async sendPositionUpdate(positionUpdate) {
    return new Promise((resolve, reject) => {
      this.webrtcUtilService.socket.emit('sendPositionUpdate', positionUpdate, () => {
        resolve(null);
      });
    });
  }

  async getBroadcastPositionUpdates(callback) {
    this.webrtcUtilService.socket.on('broadcastPosition', async (positionUpdates) => {
      positionUpdates.forEach((positionUpdate) => {
        positionUpdate.position = Position.fromJson(positionUpdate.position);
      });
      await callback(positionUpdates);
    });
  }

  async connectUser(workspaceId) {
    return new Promise((resolve, reject) => {
      this.webrtcUtilService.socket.emit('connectUser', workspaceId, () => {
        resolve(null);
      });
    });
  }

  getUserDisconnects(callback) {
    this.webrtcUtilService.socket.on('disconnectUser', async (workspaceId) => {
      await callback(workspaceId);
    });
  }

  canDeactivate: NzTabsCanDeactivateFn = (fromIndex: number, toIndex: number) => {
    switch (fromIndex) {
      case 1:
        return this.confirm();
      default:
        return true;
    }
  };

  private confirm(): Observable<boolean> {
    return new Observable(observer => {
      this.modal.confirm({
        nzTitle: '你确定要离开在线白板界面吗?',
        nzContent: '如果离开在线白板界面，当前的白板内容无法保存，将被清除，请谨慎操作。',
        nzOnOk: () => {
          observer.next(true);
          observer.complete();
        },
        nzOnCancel: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}
