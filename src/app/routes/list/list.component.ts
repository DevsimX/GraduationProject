import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styles: [],
  styleUrls: ['./list.component.less'],
})
export class ListComponent implements OnInit {
  // 存储单个场景卡片的信息, 是一个二维数组，sceneList[i][j]代表第i行第j列的卡片信息
  sceneList = [];
  // 每行显示的卡片数，请取24的因数：1 | 2 | 3 | 4 | 6 | 8 | 12 | 24
  numPerCol = 4;

  constructor() {}

  ngOnInit() {
    this.requestData();
  }

  click(scene_id){
    let baseUrl = window.location.href.split('/')[3];
    if(baseUrl !== '#'){
      baseUrl = '';
    }
    window.open(baseUrl + `/fullscreen/blockly/${scene_id}`);
  }

  formatDescription(description){
    let d = description;
    if(description > 75){
      d = description.substring(0,72) + '...';
    }
    return d;
  }

  requestData(): any{
    let that = this;
    $.get("blocklyBackend/scenes/getList", function(data,status){
      if(status === 'success' && data.msg === 'ok'){
        for(let i = 0; i < data.list.length; i += that.numPerCol){
          let col = [];
          for(let j = 0 ; j < that.numPerCol; j++){
            if(!data.list[i+j]) break;
            if(!data.list[i+j].picture){
              data.list[i+j].picture = "../../../assets/img/sample0.png";
            }
            col.push(data.list[i+j])
          }
          that.sceneList.push(col);
        }
      }
    });
  }


}
