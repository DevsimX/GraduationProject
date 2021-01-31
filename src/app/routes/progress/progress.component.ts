import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import { Crypto } from 'src/assets/crypto/crypto';
interface CryptoType{
  encode?:any;
  decode?:any;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styles: []
})
export class ProgressComponent implements OnInit {
  progressList = [];
  constructor() { }

  ngOnInit() {
    this.requestList();
  }

  click(scene_id, submit_id){
    let crypto = new Crypto() as CryptoType;
    let baseUrl = window.location.href.split('/')[3];
    if(baseUrl !== '#'){
      baseUrl = '';
    }
    window.open(baseUrl + `/fullscreen/blockly/${scene_id}?order=` + crypto.encode({'msg':'load_submit', 'submit_id':submit_id}));
  }

  requestList() {
    let that = this;
    $.get("blocklyBackend/scenes/submits?student_id=" + JSON.parse(localStorage.getItem("user")).id, function(data,status){

      if(status === 'success' && data.msg === 'ok'){
        that.progressList = data.list;
      }
    });
  }
}
