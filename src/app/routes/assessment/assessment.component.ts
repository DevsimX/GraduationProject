import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { _HttpClient } from '@delon/theme';
import { ActivatedRoute, Router } from '@angular/router';
import * as $ from 'jquery';
import { SceneService } from '../../services/scene.service';
import { NzNotificationService } from 'ng-zorro-antd';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html',
  styles: [],
})
export class AssessmentComponent implements OnInit {
  validateForm: FormGroup;
  submit = null;

  constructor(private fb: FormBuilder,
              private http: _HttpClient,
              private router: Router,
              private notification: NzNotificationService,) {
  }

  ngOnInit() {
    this.submit = JSON.parse(localStorage.getItem('currentSubmit'));
    this.validateForm = this.fb.group({
      score: [null, [Validators.required]],
      feedback: [null],
    });
  }

  submitForm(): void {
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
      if (!this.validateForm.controls[i].valid) return;
    }

    let values = this.validateForm.value;
    values.student_id = this.submit.student_id;
    values.scene_id = this.submit.scene_id;
    console.log(values);
    let r = this.router;

    $.ajax({
      type: "POST",
      url: 'blocklyBackend/update/submitEvaluation',
      data: values,
      success: function (data) {
        if (data.msg === 'ok'){
          console.log("yes");
          r.navigateByUrl('/assessRlt', {});
        }

        else {
          console.log('wrong');

        }
      }
    });
  }
}
