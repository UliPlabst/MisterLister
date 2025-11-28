namespace MisterLister.Models.Api;

public enum ErrorCode
{
    NotFound,
    NoUser,
    BadRequest,
    GenericNotAllowed,
    Offline,
    ServerError = 500
}
public class ApiError: Exception
{
    public ErrorCode Code { get; set; }
    
    public ApiError(ErrorCode code, string message, Exception? inner = null) : base(message)
    {
        Code = code;
    }
    
    public static ApiError FromException(Exception e)
    {
        if(e is ApiError apiError)
            return apiError;
        var code = e switch {
            _ => ErrorCode.ServerError
        };
        return new ApiError(code, e.Message, e);
    }
    
    public static ApiError NotFound() => new ApiError(ErrorCode.NotFound, "Not found");
    
}