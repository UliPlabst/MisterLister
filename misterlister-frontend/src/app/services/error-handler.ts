import { ErrorHandler } from "@angular/core";

export class CustomErrorHandler implements ErrorHandler
{
  handleError(error: any): void
  {
    console.error(error);
  }
  
  unwrapError(error: any)
  {
    function isPromiseRejection(e: any): e is { rejection: any }
    {
      return e != null && typeof e == "object" && "rejection" in e;
    }

    while(isPromiseRejection(error))
    {
      error = error.rejection
    }
    return error;
  }
}