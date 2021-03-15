import { TestBed, async, inject } from '@angular/core/testing';

import { RemoteControlGuard } from './remoteControl.guard';

describe('RemoteControlGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RemoteControlGuard]
    });
  });

  it('should ...', inject([RemoteControlGuard], (guard: RemoteControlGuard) => {
    expect(guard).toBeTruthy();
  }));
});
