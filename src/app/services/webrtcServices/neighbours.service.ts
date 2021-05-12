import {Injectable} from '@angular/core';
import {WebrtcUtilService} from "./webrtc-util.service";

/*
neighbour object
 */
export class Neighbour {
  socketId: string
  username: string;
  name: string;
  peer_connection: RTCPeerConnection;
  data_channel: RTCDataChannel;
  file_channel: any[];
  mediaStream: MediaStream;

  constructor(socketId: string, username: string, name: string, peer_connection: RTCPeerConnection, data_channel: RTCDataChannel, file_channel: any[], mediaStream: MediaStream) {
    this.socketId = socketId;
    this.username = username;
    this.name = name;
    this.peer_connection = peer_connection;
    this.data_channel = data_channel;
    this.file_channel = file_channel;
    this.mediaStream = mediaStream;
  }
}
@Injectable({
  providedIn: 'root'
})
/*
service part
 */
export class NeighboursService {

  constructor(
    private webrtcUtilService: WebrtcUtilService,
  ) {
  }

  addNeighbour(socketId: string, username: string, name: string, peer_connection: RTCPeerConnection, data_channel: RTCDataChannel, file_channel: [], mediaStream: MediaStream) {
    this.webrtcUtilService.neighbours.push(new Neighbour(socketId, username, name, peer_connection, data_channel, file_channel, mediaStream));
  }

  getNeighbourBySocketId(socketId: string): Neighbour {
    for (const neighbourElement of this.webrtcUtilService.neighbours) {
      if (neighbourElement.socketId == socketId) {
        return neighbourElement;
      }
    }
    return null;
  }

  deleteNeighbourBySocketId(socketId: string): boolean {
    for (let i = 0; i < this.webrtcUtilService.neighbours.length; i++) {
      if (socketId === this.webrtcUtilService.neighbours[i].socketId) {
        this.webrtcUtilService.neighbours.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  addTrackToNeighbour(socketId: string, track: MediaStreamTrack) {
    let neighbour = this.getNeighbourBySocketId(socketId);
    let stream;
    if(!neighbour.mediaStream)
      stream = neighbour.mediaStream = new MediaStream();
    else
      stream = neighbour.mediaStream;
    if (track.kind === 'video') {
      if (stream.getVideoTracks().length !== 0) {
        stream.removeTrack(stream.getVideoTracks()[0]);
        stream.addTrack(track);
      } else
        stream.addTrack(track);
    } else if (track.kind === 'audio') {
      if (stream.getAudioTracks().length !== 0) {
        stream.removeTrack(stream.getAudioTracks()[0]);
        stream.addTrack(track);
      } else
        stream.addTrack(track)
    }
  }

  get neighbours(): Neighbour[] {
    return this.webrtcUtilService.neighbours;
  }

  clear(){
    this.webrtcUtilService.neighbours = [];
  }
}
