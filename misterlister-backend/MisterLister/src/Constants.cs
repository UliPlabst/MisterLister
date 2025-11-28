namespace MisterLister;

public class Constants
{
    public readonly static Constants C = new();
    public bool IsDevEnvironment => Config.Env.Mode == "dev";
    
    public Config Config { get; set; }
    public const string RATELIMIT_POLICY = "ratelimit";
    
    private Constants()
    {
    }
}

public class Config
{
    public EnvConfig Env { get; set; }    = new();
    public string Domain { get; set; }    = "http://localhost:4200";
    public int Port { get; set; }         = 5000;
    public string IpAddress { get; set; } = "127.0.0.1";
}

public class EnvConfig
{
    public string Mode { get; set; } = "prod";
}