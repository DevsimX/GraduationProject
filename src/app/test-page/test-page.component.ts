import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-test-page',
  templateUrl: './test-page.component.html',
  styles: []
})
export class TestPageComponent implements OnInit {
  that: any = undefined
  fileList: any[] = []

  constructor() {
  }

  ngOnInit(): void {
    this.that = this;
  }

  handleChange(event) {
    console.log(event)
  }

  handle = (file, fileList): boolean => {
    console.log(file)
    console.log(fileList)
    this.fileList = this.fileList.concat(fileList);
    console.log(this)
    return false;
  }

}
