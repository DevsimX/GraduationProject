import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() { }

  log(text) {
    let time = new Date();

    console.log("[" + time.toLocaleTimeString() + "] " + text);
  }

  log_error(errMessage){
    this.log(`Error ${errMessage.name}: ${errMessage.message}`);
  }
}
