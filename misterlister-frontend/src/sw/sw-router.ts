export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type RouteHandlerOpts = {
  method?: HttpMethod 
}

export class RouteFragment
{
  private argName = null;
  constructor(
    private fragment: string
  )
  {
    if(fragment.startsWith(":"))
    {
      this.argName = fragment.substring(1);
    }
  }
  
  match(segment: string, result: Map<string, string>): boolean
  {
    if(this.argName != null)
    {
      result.set(this.argName, segment);
      return true;
    }
    return this.fragment == segment;
  }
}

export class RouteHandler
{
  private fragments: RouteFragment[];
  constructor(
    private route: string, 
    public handler: (event: FetchEvent, params: Map<string, string>) => Promise<Response>,
    private opts: RouteHandlerOpts
  )
  {
    this.fragments = route
      .split("/")
      .filter(e => e.length > 0)
      .map(e => new RouteFragment(e));
  }
  
  match(event: FetchEvent): Map<string, string>
  {
    if(this.opts?.method != null && event.request.method != this.opts.method)
      return null;
    const url = new URL(event.request.url);
    const map = new Map<string, string>();
    const segments = url.pathname.split("/").filter(x => x.length > 0);
    if(this.fragments.every((s,i) => segments[i] != null && s.match(segments[i], map)))
    {
      return map;
    }
    return null;
  }
}

export class SwRouter
{
  handlers: RouteHandler[] = [];
  on(handler: {
    route: string,
    fn: (event: FetchEvent, params: Map<string, string>) => Promise<Response>,
    opts?: RouteHandlerOpts
  })
  {
    this.handlers.push(new RouteHandler(handler.route, handler.fn, handler.opts));
    return this;
  }
  
  handle(event: FetchEvent): boolean
  {
    for(let h of this.handlers)
    {
      const map = h.match(event);
      if(map != null)
      {
        event.respondWith(h.handler(event, map));
        return true;
      }
    }
    return false;
  }
}