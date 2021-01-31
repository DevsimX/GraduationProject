export interface SceneType {
  id: number;
  title: string;
  description: string;
  level_number: number;
  create_id: number;
  script?: string;
  objects?: string;
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
  l5?: string;
  l6?: string;
  l7?: string;
  l8?: string;
  three_id?: number;
  check_way?:number;
}

export interface SubmitType {
  student_id?: number;
  scene_id: number;
  script: string;
  level: number;
  objects: string;
  user_id?: number;
  check_way?: number;
  score?: number;
  result?: string;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class SceneService{
  constructor(private http: HttpClient) {}

  getScene(id){
    return this.http.get('blocklyBackend/scenes/getScene',{
      params:{
        id
      }
    })
  }

  submit(submit:SubmitType){
    const formData = new FormData();
    Object.keys(submit).forEach(item=>{
      formData.append(item, submit[item])
    });
    return this.http.post('blocklyBackend/insert/saveSubmit',formData);
  }

  saveHistory(submit:SubmitType){
    const formData = new FormData();
    Object.keys(submit).forEach(item=>{
      formData.append(item, submit[item])
    });
    return this.http.post('blocklyBackend/insert/saveHistory',formData);
  }

  getHistory(student_id){
    return this.http.get('blocklyBackend/scenes/save',{
      params:{
        student_id,
      }
    })
  }
  getSubmit(submit_id){
    return this.http.get('blocklyBackend/scenes/submit',{
      params:{
        submit_id,
      }
    })
  }
  updateScene(params:any){
    const formData = new FormData();
    Object.keys(params).forEach(item=>{
      formData.append(item, params[item])
    });
    return this.http.post('blocklyBackend/update/saveObjectsAndScript',formData)
  }
}
