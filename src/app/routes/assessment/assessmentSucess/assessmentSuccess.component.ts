import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { _HttpClient } from '@delon/theme';

@Component({
  selector: 'app-assessmentSuccess',
  templateUrl: './assessmentSuccess.component.html',
  styles: []
})
export class AssessmentSuccessComponent implements OnInit {
  constructor(private fb: FormBuilder, private http: _HttpClient) { }

  ngOnInit() {
  }
}
