import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styles: []
})
export class WhiteboardComponent implements OnInit {
  //等待开发

  constructor() {
  }

  ngOnInit(): void {
  }

  onCanvasDraw(event) {
    console.log(event)
  }

  onCanvasClear() {

  }

  onCanvasUndo(event) {
    console.log(event)
  }

  onCanvasRedo(event) {
    console.log(event)
  }

  onCanvasSave(event) {
    console.log(event)
  }

}
