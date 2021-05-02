import {Injectable} from '@angular/core';
import {Client} from "../../object/webrtc/client";

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private _client: Client

  constructor() {
  }


}
