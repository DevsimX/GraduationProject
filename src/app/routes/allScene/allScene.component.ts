import { Component, OnInit } from '@angular/core';
import { _HttpClient} from '@delon/theme';
import { Crypto } from 'src/assets/crypto/crypto';
interface CryptoType{
  encode?:any;
  decode?:any;
}

@Component({
  selector: 'app-allScene',
  templateUrl: './allScene.component.html',
  styles: []
})
export class AllSceneComponent implements OnInit {
  list = [];
  drawerVisible = false;
  currentDrawerData = {title:'', description: '', l1:'', l2: '', l3: '', l4: '', l5: '', l6: '', l7:'', l8:''};

  constructor(private http: _HttpClient) { }

  ngOnInit() {
    this.requestData(this);
  }

  requestData(that){
    this.http.get("blocklyBackend/scenes/getSceneByTeacherId?teacher_id="+ JSON.parse(localStorage.getItem("user")).id)
      .subscribe((res)=>{
        if(res.msg === 'ok'){
          that.list = res.list;
        }
      })
  }

  create(scene_id){
    let crypto = new Crypto() as CryptoType;
    let baseUrl = window.location.href.split('/')[3];
    if(baseUrl !== '#'){
      baseUrl = '';
    }
    window.open(baseUrl + `/fullscreen/blockly/${scene_id}?order=` + crypto.encode({
      'msg': 'create_scene'
    }));
  }
  shorten(description){
    if(description.length < 23){
      return description;
    } else {
      return description.substr(0,20) + `...`
    }
  }
  check(scene_id){
    let crypto = new Crypto() as CryptoType;
    let baseUrl = window.location.href.split('/')[3];
    if(baseUrl !== '#'){
      baseUrl = '';
    }
    window.open(baseUrl + `/fullscreen/blockly/${scene_id}?order=` + crypto.encode({
      'msg': 'load_create'
    }));
  }
  openDrawer(data){
    this.currentDrawerData = data;
    this.drawerVisible = true;
  }
  closeDrawer(){
    this.drawerVisible = false;
  }
  myAlert(description){
    alert(description)
  }

}
