using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using MisterLister.Database;
using MisterLister.Misc;

namespace MisterLister;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        
        var configFile = "config.json";
        if(!File.Exists(configFile))
            throw new Exception("Config file not found");
            
        Constants.C.Config = System.Text.Json.JsonSerializer.Deserialize<Config>(File.ReadAllText(configFile))
            ?? throw new Exception("Could not parse config");

        var services = builder.Services;
        services
            .AddControllers(cfg => {
                cfg.Filters.Add<GlobalActionFilter>();
            })
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new Json.ExceptionJsonConverterFactory());
                options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                // options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                // options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });
        services.AddDbContext<AppDbContext>();
        services.AddRateLimiter(options =>
        {
            options.AddPolicy(
                Constants.RATELIMIT_POLICY, 
                context => RateLimitPartition.GetTokenBucketLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString(),
                    factory: key => new TokenBucketRateLimiterOptions
                    {
                        TokenLimit           = 10, 
                        ReplenishmentPeriod  = TimeSpan.FromSeconds(15), 
                        TokensPerPeriod      = 10,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit           = 1 
                    }
                )
            );
        });
        
        services.AddCors(options => {
            options.AddDefaultPolicy(builder => {
                builder.WithOrigins(Constants.C.Config.Domain)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });
        
        services.Configure<KestrelServerOptions>(static opts => {
           opts.Listen(
               IPAddress.Parse(Constants.C.Config.IpAddress), 
               Constants.C.Config.Port
           );
        });
        
        var app = builder.Build();
        
        using(var scope = app.Services.CreateScope())
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Applying database migrations...");
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await dbContext.Database.MigrateAsync();
        }

        app.UseCors();
        app.MapControllers();

        app.Run();
    }
}
