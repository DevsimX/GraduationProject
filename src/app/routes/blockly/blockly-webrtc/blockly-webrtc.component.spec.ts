import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlocklyWebrtcComponent } from './blockly-webrtc.component';

describe('BlocklyWebrtcComponent', () => {
  let component: BlocklyWebrtcComponent;
  let fixture: ComponentFixture<BlocklyWebrtcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlocklyWebrtcComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlocklyWebrtcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
