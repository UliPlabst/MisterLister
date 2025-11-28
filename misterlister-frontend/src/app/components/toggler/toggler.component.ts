import { Component, Input } from '@angular/core';
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
}
