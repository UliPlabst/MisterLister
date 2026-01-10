using System.ComponentModel.Design.Serialization;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using MisterLister.Models.Api;

namespace MisterLister.Misc;

public class GlobalActionFilter(
    ILogger<GlobalActionFilter> logger
) : IActionFilter
{
    public void OnActionExecuted(ActionExecutedContext context)
    {
        if (context.Exception != null)
        {
            context.Result = ExceptionHandler(context, context.Exception);
            logger.LogError(context.Exception, "Error {message} {type} in controller {controller} action {action}\nStackTrace:\n{stacktrace}", 
                context.Exception.Message,
                context.Exception.GetType().Name,
                context.ActionDescriptor is ControllerActionDescriptor cad ? cad.ActionName : "",
                context.ActionDescriptor is ControllerActionDescriptor cad2 ? cad2.ControllerName : "",
                context.Exception.StackTrace
            );
            context.ExceptionHandled = true;
        }
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        //check modelstate for errors and generate an error message
        if (!context.ModelState.IsValid)
        {
            var error = ApiError.FromException(new ApiError(ErrorCode.BadRequest, "Invalid model state"));
            logger.LogError(error, "Error in controller {controller} action {action}\nStackTrace:\n{stacktrace}", 
                context.ActionDescriptor is ControllerActionDescriptor cad ? cad.ActionName : "",
                context.ActionDescriptor is ControllerActionDescriptor cad2 ? cad2.ControllerName : "",
                error.StackTrace
            );
            context.Result = new JsonResult(error) 
            { 
                StatusCode = (int)HttpStatusCode.BadRequest 
            };
        }
    }

    protected virtual IActionResult ExceptionHandler(ActionExecutedContext ctx, Exception ex)
    {
        var httpContext = ctx.HttpContext;

        var error = ApiError.FromException(ex);

        var StatusCode = error.Code switch
        {
            ErrorCode.BadRequest => HttpStatusCode.BadRequest,
            ErrorCode.GenericNotAllowed => HttpStatusCode.Forbidden,
            _ => HttpStatusCode.InternalServerError,
        };
        httpContext.Response.StatusCode = (int)StatusCode;
        return new JsonResult(error);
    }
}