import { Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  howToUseList = [
    'testButton',
    'testTable',
    'testInput',
  ];
  currentStep: number;


  //——————————————————————————————————————————
  currentIndex = 0;
  allMsg = [
    { msg: 'hello a, hello yoo', img: 'sample3.png' },
    { msg: 'hua ku', img: 'sample4.png'},
    { msg: 'nb nb nb', img: 'clipboard.png' },
  ];
  buttonMsg = '下一步';

  isVisible = false;

  constructor(private http: _HttpClient) {
  }

  ngOnInit() {
    this.currentStep = 0;
  }

  howToUse(): void {
    this.currentStep = 0;
    this.simulateClick();
  }

  cancel(): void {
    this.currentStep = 0;
  }

  howToUseConfirm(): void {
    this.simulateClick();
  }

  simulateClick() {
    if (this.currentStep === this.howToUseList.length) {
      this.currentStep = 0;
      return;
    }

    let e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    document.getElementById(this.howToUseList[this.currentStep++]).dispatchEvent(e);
  }

  //——————————————————————————————————————————————
  handleOk() {
    console.log(this.currentIndex);
    if (this.currentIndex != this.allMsg.length - 1) {
      this.currentIndex++;

      if (this.currentIndex == this.allMsg.length - 1) {
        this.buttonMsg = '完成';
      }
    } else {
      this.isVisible = false;
    }

  }

  handleCancel() {

    this.isVisible = false;
  }

  show() {
    this.buttonMsg = '下一步';
    this.currentIndex = 0;
    this.isVisible = true;
  }

}
