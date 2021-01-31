import { CanActivate, CanActivateChild } from '@angular/router';
import { Observable } from 'rxjs';
import { Injector, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StartupService } from '@core/startup/startup.service';

@Injectable()
export class LoginGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private injector: Injector,
    public st: StartupService,
  ) { }
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.logIn();
  }
  canActivateChild(): Observable<boolean> | Promise<boolean> | boolean {
    return this.logIn();
  }
  private logIn() {
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.goTo('/passport/login');
      return false;
    } else {
      return true;
    }
  }
  private goTo(url: string) {
    setTimeout(() => this.injector.get(Router).navigateByUrl(url));
  }
}
