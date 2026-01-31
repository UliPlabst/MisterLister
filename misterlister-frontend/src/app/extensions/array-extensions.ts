
declare global {
  interface Array<T> {
    contains(arg: T | ((el: T) => boolean)): boolean;
    remove(arg: T | ((el: T, i: number) => boolean)): boolean;
    all(fn?: (el: T, i?: number) => boolean): boolean;
    orderBy<TProp>(fn: (el: T) => TProp, comparer?: (a: TProp, b: TProp) => number): Array<T>;
    orderByStable(fn: (el: T) => any): Array<T>;
    split(fn: (el: T) => boolean): [true: Array<T>, false: Array<T>]
    first(fn?: (el: T) => boolean): T;
    last(fn?: (el: T) => boolean): T;
    shuffle(): T[];
    distinct(): Array<T>;
    enumerate(): Array<[el: T, idx: number, isLast: boolean]>;
    repeat(cnt: number): Array<T>;
    distinctBy(fn: (e: T) => unknown): Array<T>;
  }
  
  interface ReadonlyArray<T>
  {
    contains(arg: T | ((el: T) => boolean)): boolean;
  }

  interface ArrayConstructor
  {
    join<T>(...arrays: Array<T>[]): Array<T>;
    create<T>(): Array<T>;
    range(start: number, end: number, step?: number): number[]
    zip<T1,T2>(ar1: T1[], ar2: T2[]): Array<[T1, T2]>;
  }
}

Array.prototype.enumerate = function(this: any[])
{
  return this.map((e,i) => [e, i, i == this.length - 1])
}

Array.prototype.repeat = function(cnt: number)
{
  return Array.range(0, cnt).map(e => this).flatMap(e => e);
}

Array.prototype.split = function(this: any[], fn: (el: any) => boolean)
{
  let t = [];
  let f = [];
  for(let a of this)
  {
    if(fn(a))
      t.push(a);
    else
      f.push(a);
  }
  return [t,f];
}

Array.zip = function<T1, T2>(ar1: T1[], ar2: T2[])
{
  let end = Math.max(ar1.length, ar2.length);
  let res = [] as Array<[T1, T2]>;
  for(let i=0; i<end; i++)
  {
    res.push([ar1[i], ar2[i]]);
  }
  return res;
}

Array.range = function(start: number, end: number, step: number = 1)
{
  if(step == 0)
    throw new Error("Step must no be null!");
  if(step > 0)
  {
    let len = Math.floor((end - start) / step);
    if(len < 0 || !Number.isInteger(len))
      throw new Error("Array length must be greater 0");
    let res: number[] = Array(len);
    let idx = 0;
    for(let i=start; i<end; i += step)
    {
      res[idx] = i;
      idx++;
    }
    return res;
  }
  else
  {
    let len = Math.floor((end - start) / step);
    if(len < 0 || !Number.isInteger(len))
      throw new Error("Array length must be greater 0");
    let res: number[] = Array(len)
    let idx = 0;
    for(let i=start; i>end; i += step)
    {
      res[idx] = i;
      idx++;
    }
    return res;
  }
}

Array.prototype.shuffle = function(this: any[])
{
  let i = 0;
  let a = [...this];
  for (i = a.length - 1; i > 0; i--)
  {
      let j = Math.floor(Math.random() * (i + 1));
      let x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

Array.join = function(...arrays: [][])
{
  return arrays.filter(e => e != null).reduce((c,v) => c.concat(v), [])
}

Array.prototype.contains = function(arg) {
  if(typeof(arg) == "function")
    return this.find(arg) != null;

  return this.indexOf(arg) >= 0;
};

Array.prototype.distinctBy = function(this: any[], fn: (e: any) => unknown)
{
  return this.filter((e,i,a) => a.findIndex(_ => fn(e) == fn(_)) == i);
}

Array.prototype.distinct = function(this: any[]) {
  if(this == null)
    return null;
  return this.filter((v,i,a) => a.indexOf(v) == i);
};


Array.prototype.first = function<T>(this: Array<T>, fn: (el: T) => boolean = null) {
  if(this == null)
    return null;
  if(typeof(fn) == "function")
    return this.find(fn);
  return this[0];
};

Array.prototype.last = function<T>(this: Array<T>, fn: (el: T) => boolean = null) {
  if(this == null || this.length == 0)
    return null;
  if(typeof(fn) == "function")
    return this.reverse().find(fn);
  return this[this.length - 1];
};

Array.prototype.orderBy = function(arg, comparer) {
  this.sort((a: any, b: any) => {
    let _a = arg(a);
    let _b = arg(b);
    if(comparer != null)
      return comparer(_a, _b);
    return _a == _b ? 0 : (_a < _b ? -1 : 1);
  });
  return this;
};

// Array.prototype.orderByStable = function(this: any[], arg) {
//   this.stableSort((a: any, b: any) => {
//     let _a = arg(a);
//     let _b = arg(b);
//     return _a == _b ? 0 : (_a < _b ? -1 : 1);
//   });
//   return this;
// };
http://localhost:4200/list/34edadbb-eaca-4d87-b2ad-d601aeaa683e#key=ISjJvu2KknopT8JFEygiq6JLn9N3bW9DBK3K6r+bh2M=
Array.prototype.remove = function(arg) {
  let res = false;
  if(typeof(arg) == "function")
  {
    for(let el of this.filter(arg))
    {
      res = true;
      this.splice(this.indexOf(el), 1);
    }
  }
  else
  {
    let idx = this.indexOf(arg);
    if(idx >= 0)
    {
      res = true;
      this.splice(idx, 1);
    }
  }
  return res;
};

Array.prototype.all = function(fn) {
  let i = 0;
  for(let el of this)
  {
    if(fn(el,i) == false)
      return false;
    i++;
  }
  return true;
};

export { };

