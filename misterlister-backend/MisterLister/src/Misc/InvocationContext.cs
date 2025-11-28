namespace MisterLister.Misc;

public class InvocationContext(
    string user
)
{
    public string User { get; } = user;
    public DateTime InvocationTime = DateTime.UtcNow;
}