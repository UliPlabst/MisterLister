import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, distinctUntilChanged, scan, switchMap, timestamp } from 'rxjs/operators';
import { DisposableCollection, sleep } from 'src/app/utils';


export function minBusyTime(time: number): (source$: Observable<boolean>) => Observable<boolean> {
  return (source$) => source$.pipe(
    timestamp(),
    scan(
      (acc, curr) => {
        if (curr.value) {
          return { value: true, timestamp: curr.timestamp };
        } else {
          // Busy became false, delay if needed
          const elapsed = curr.timestamp - acc.timestamp;
          const delayTime = Math.max(0, time - elapsed);
          return {
            value: false,
            timestamp: curr.timestamp,
            delayTime
          };
        }
      },
      { value: false, timestamp: 0, delayTime: 0 }
    ),
    switchMap((state) => 
      state.value ? of(true) : of(false).pipe(delay(state.delayTime))
    )
  );
}

type State = "idle"|"busy"|"success"|"failure";

@Component({
  selector: 'app-button-progress-wrapper',
  templateUrl: './button-progress-wrapper.component.html',
  styleUrls: ['./button-progress-wrapper.component.sass'],
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    CommonModule,
    MatIconModule
  ]
})
export class ButtonProgressWrapperComponent<TBusy extends true|false|string|null = boolean> implements OnInit, OnDestroy
{
  @Input()
  color: string;
  busy$ = new BehaviorSubject<State>("idle");

  constructor()
  {
  }

  ngOnInit(): void
  {
  }
  
  ngOnDestroy(): void
  {
    this.busy$.complete();
  }
  
  async invoke(action: () => Promise<any>)
  {
    this.busy$.next("busy");
    try
    {
      let p = action();
      await Promise.all([p, sleep(500)])
      this.busy$.next("success");
      setTimeout(() => {
        this.busy$.next("idle");
      }, 1000)
    }
    catch(err)
    {
      this.busy$.next("failure"); 
      setTimeout(() => {
        this.busy$.next("idle");
      }, 1000)
    }
  }
}
