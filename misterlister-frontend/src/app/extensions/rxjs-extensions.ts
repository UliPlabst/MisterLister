import { Subscription } from "rxjs";
import { DisposableCollection } from "../utils";

declare module "rxjs" {
  interface Subscription
  {
    addTo(subs: DisposableCollection): Subscription
    dispose(): void;
    [Symbol.dispose](): void;
  }
}

Subscription.prototype.dispose = function(this: Subscription) {
  this.unsubscribe();
}

Subscription.prototype[Symbol.dispose] = function(this: Subscription) { this.dispose(); }

Subscription.prototype.addTo = function(this: Subscription, subs: DisposableCollection) {
  subs.push(this);
  return this;
}