
export function debounced<T extends any[]>(timeout: number, fn: (...args: T) => any): (...args: T) => void
{
  let timer: NodeJS.Timeout|null = null;
  return (...args) => {
    if(timer != null)
    {
      clearTimeout(timer);
      timer = null;
    }
    
    timer = setTimeout(() => {
      fn(...args);
    }, timeout)
  }
}

