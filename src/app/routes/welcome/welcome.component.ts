import { Component, Inject, OnInit } from '@angular/core';
import * as $ from 'jquery';
import { Crypto } from 'src/assets/crypto/crypto';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
interface CryptoType{
  encode?:any;
  decode?:any;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styles: []
})



export class WelcomeComponent implements OnInit {
  history = {mt: ""};
  scene = {title:"", id: undefined};
  continue = false;
  username = '';
  hasHistory=false;
  role:string='student';
  quote='博学而笃志，切问而近思';
  age=21;

  constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) { }

  ngOnInit() {
    this.username = JSON.parse(localStorage.getItem("user")).username;
    this.requestList();
    this.role = this.tokenService.get().role;
    if(this.role === 'teacher'){
      this.quote = '那里湖面总是澄清，那里空气充满宁静';
      this.age = 38;
    }
  }

  click(){
    let crypto = new Crypto() as CryptoType;
    if(this.scene.id){
      let baseUrl = window.location.href.split('/')[3];
      if(baseUrl !== '#'){
        baseUrl = '';
      }
      window.open(baseUrl + `/fullscreen/blockly/${this.scene.id}?order=` + crypto.encode({'msg':'load_history'}));
    }
  }

  requestList() {
    let that = this;
    $.get("blocklyBackend/scenes/save?student_id=" +
      JSON.parse(localStorage.getItem("user")).id, function(data,status){
      if(status === 'success' && data.msg === 'ok'){
        if(data.data.scene.id){
          that.history = data.data.history;
          that.scene = data.data.scene;
          that.continue = true;
          that.hasHistory = true;
        }
      }
    });
  }
}
