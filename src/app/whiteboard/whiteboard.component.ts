import {Component, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {CanvasWhiteboardComponent, CanvasWhiteboardService, CanvasWhiteboardUpdate} from "ng2-canvas-whiteboard";
import {WebrtcUtilService} from "../services/webrtcServices/webrtc-util.service";

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styles: [],
  styleUrls: ['./whiteboard.component.less'],
})
export class WhiteboardComponent implements OnInit {
  @ViewChild(CanvasWhiteboardComponent) canvasWhiteboardComponent: CanvasWhiteboardComponent;
  serverId:number = 0;
  //等待开发

  constructor(private canvasWhiteboardService: CanvasWhiteboardService,
              private webrtcUtilService: WebrtcUtilService,
              ) {
  }

  ngOnInit(): void {
    this.getEvent()
    this.webrtcUtilService.socket.on('dispatch',() =>{
      console.log('dispatch')
      this.getEvent();
    })
    this.webrtcUtilService.socket.on('clearEvent',() =>{
      console.log('clearEvent')
      this.serverId = 0
      this.canvasWhiteboardService.clearCanvas();
    })
    this.webrtcUtilService.socket.on('undoEvent',(data)=>{
      console.log('undoevent')
      console.log(data)
      this.canvasWhiteboardService.undoCanvas(data.uuid);
      this.serverId = data.serverId;
    })
  }

  getEvent(){
    this.webrtcUtilService.socket.emit('get_whiteboard_event',this.serverId,(events)=>{
      console.log(events)
      let array = JSON.parse(events)
      array.forEach((item)=>{
        let item_event = item.event;
        let serverId = item.serverId;
        this.updateCanvas(item_event,serverId);
      })
    })
  }

  updateCanvas(event: string, serverId: number){
    let array = JSON.parse(event);
    console.log(array)
    const updates: Array<CanvasWhiteboardUpdate> = array.map(updateJSON =>
      CanvasWhiteboardUpdate.deserializeJson(updateJSON));

    this.canvasWhiteboardService.drawCanvas(updates)
    this.serverId = this.serverId > serverId? this.serverId : serverId;
  }

  onCanvasDraw(event) {
    let uuid = event[0].UUID;
    const updates: Array<CanvasWhiteboardUpdate> = event;
    // Stringify the updates, which will return an Array<string>
    const stringifiedUpdatesArray: Array<string> = updates.map(update => update.stringify());
    // Stringify the Array<string> to get a "string", so we are now ready to put this item in the storage
    const stringifiedStorageUpdates: string = JSON.stringify(stringifiedUpdatesArray);

    this.webrtcUtilService.socket.emit('update_whiteboard_event',uuid,stringifiedStorageUpdates)
  }

  onCanvasClear() {
    this.webrtcUtilService.socket.emit('clear')
    this.serverId = 0
  }

  onCanvasUndo(event) {
    //TODO send to server, an instruction
    this.webrtcUtilService.socket.emit('undo',event,(serverId)=>{
      console.log(serverId);
      this.serverId = serverId
    })
  }

  onCanvasSave(event) {
    console.log(event)
  }

}
