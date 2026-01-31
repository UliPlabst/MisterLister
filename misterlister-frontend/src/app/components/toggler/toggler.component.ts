import { Component, ElementRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toggler',
  imports: [
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './toggler.component.html',
  styleUrl: './toggler.component.sass',
})
export class TogglerComponent 
{ 
  @Input()
  toggled: boolean = false;
  
  @Output()
  toggledChange = new EventEmitter<boolean>();
  
  el = inject(ElementRef<HTMLElement>);
  
  toggle(isToggled?: boolean)
  {
    isToggled ??= !this.toggled;
    this.toggled = isToggled;
    this.toggledChange.emit(this.toggled);
  }
}
