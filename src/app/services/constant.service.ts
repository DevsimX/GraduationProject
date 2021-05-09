import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConstantService {
  public webrtc_path = "wss://www.xytcloud.ltd:4433/xyt";
  public iceServer = {
    "iceServers": [
      {
        "url": "stun:stun.l.google.com:19302"
      },
      {
        "url": "stun:global.stun.twilio.com:3478"
      },
      {
        "url": "turn:global.stun.twilio.com:3478",
        "username": "79fdd6b3c57147c5cc44944344c69d85624b63ec30624b8674ddc67b145e3f3c",
        "credential": "xjfTOLkVmDtvFDrDKvpacXU7YofAwPg6P6TXKiztVGw"
      }
    ]
  };
  public getUserMedia = (
    navigator.mediaDevices.getUserMedia ||//最新的标准API
    navigator.getUserMedia //旧版API
  );
  packetSize = 1000

  constructor() { }
}
