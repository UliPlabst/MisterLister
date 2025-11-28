import { Component, HostBinding, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-slide-bar',
  templateUrl: './slide-bar.component.html',
  styleUrls: ['./slide-bar.component.sass'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
  ]
})
export class SlideBarComponent
{
  @Input()
  name: string;
  
  @Input()
  @HostBinding("class.toggled")
  toggled = false;

  @Input()
  alignment: "left" | "right" = "left";

  constructor(
  )
  {
  }

  toggle(isToggled: boolean = null)
  {
    if(isToggled == null)
      this.toggled = !this.toggled;
    else
      this.toggled = isToggled;
  }

  close()
  {
    this.toggled = false;
  }

}
