import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import * as $ from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class RemoteControlGuard implements CanActivate, CanActivateChild, CanLoad {
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    let queryParams = next.queryParams;
    if(Object.keys(queryParams).length === 2){
      let controller = queryParams['controller'];
      let controlled = queryParams['controlled'];

      if(controller&& controlled){
        let res = false;
        $.ajax({
          type: "POST",
          url: 'https://xytcloud.ltd:8001/remoteControl/',
          data: queryParams,
          async: false,
          success: function (data) {
            res = data.msg === 'ok';
          },
        });
        return res;
      }else {
        return false;
      }
    }
    return false;
  }
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.canActivate(next,state);
  }
  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }
}
