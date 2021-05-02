export class Neighbour {
  username: string;
  name: string;
  peer_connection: RTCPeerConnection;
  data_channel: RTCDataChannel;
  file_channel: [];
}
