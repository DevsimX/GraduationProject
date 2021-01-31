import { Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { Crypto } from 'src/assets/crypto/crypto';
interface CryptoType{
  encode?:any;
  decode?:any;
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styles: []
})
export class StatisticsComponent implements OnInit {
  list = [];

  constructor(private http: _HttpClient) {
  }

  ngOnInit() {
    this.requestData();
  }

  requestData() {
    let that = this;
    this.http.get("blocklyBackend/getSubmit/getSubmitByTeacherId?teacher_id=" + JSON.parse(localStorage.getItem("user")).id)
      .subscribe((res) => {
        if (res.msg === 'ok') {
          console.log(res.data)
          that.list = res.data;
        }
      })
  }

  assessClick(submit_id, data) {
    let baseUrl = window.location.href.split('/')[3];
    if(baseUrl !== '#'){
      baseUrl = '';
    }
    window.location.href = baseUrl + `/assess/${submit_id}`;
    localStorage.setItem("currentSubmit", JSON.stringify(data));
  }

  checkClick(scene_id, submit_id) {
    let crypto = new Crypto() as CryptoType;
    let baseUrl = window.location.href.split('/')[3];
    if(baseUrl !== '#'){
      baseUrl = '';
    }
    window.open(baseUrl + `/fullscreen/blockly/${scene_id}?order=` + crypto.encode({
      'msg': 'load_submit',
      'submit_id': submit_id
    }));
  }
}


