import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { _HttpClient } from '@delon/theme';
import { from } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd';
import * as $ from 'jquery';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styles: [],
})
export class CreateComponent implements OnInit {
  validateForm: FormGroup;
  levelDes = [0];


  constructor(private fb: FormBuilder, private http: _HttpClient, private notification: NzNotificationService) {
  }

  ngOnInit() {
    this.validateForm = this.fb.group({
      title: [null, [Validators.required]],
      description: [null, [Validators.required]],
      check_way: [null, [Validators.required]],
      level_number: [1, [Validators.required]],
      l1: [null, [Validators.required]],
      l2: [null, []],
      l3: [null, []],
      l4: [null, []],
      l5: [null, []],
      l6: [null, []],
      l7: [null, []],
      l8: [null, []],
    });


  }

  submitForm(): void {
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();

      if (!this.validateForm.controls[i].valid) {
        return;
      }
    }
    let values = this.validateForm.value;

    for (let i = values.level_number; i < 8; i++) {
      values['l' + (i + 1)] = null;
    }

    values.create_id = JSON.parse(localStorage.getItem('user')).id;
    values.three_id = 1;

    this.submitData(values, this.notification)
  }

  submitData(values, nt : NzNotificationService){
    $.ajax({
      type: "POST",
      url: 'blocklyBackend/insert/saveScene',
      data: values,
      success: function (data) {
        if (data.msg === 'ok'){
          nt.success(
            '成功',
            '场景已创建'
          );
          setTimeout(function() {
            let baseUrl = window.location.href.split('/')[3];
            if(baseUrl !== '#'){
              baseUrl = '';
            }
            window.location.href = baseUrl + `/allScene`;
          },1000)
        }
        else {
          nt.success(
            '失败',
            '场景创建失败',
          );
        }
      }
    });
  }

  numberChange() {
    this.levelDes = [];
    for (let i = 0; i < this.validateForm.value.level_number; i++) {
      this.levelDes.push(i);
    }
  }
}
