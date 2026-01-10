using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MisterLister.Models;
using MisterLister.Models.Database;


namespace MisterLister.Database;

public class AppDbContext: DbContext
{
    #nullable disable
    public DbSet<CheckList> CheckLists { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        var dir = Environment.CurrentDirectory;
        optionsBuilder.UseSqlite($"Data Source={dir}/misterlister.db");
        base.OnConfiguring(optionsBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        foreach(var e in ModelTypes())
        {
            e.GetMethod("ConfigureModel", BindingFlags.Public | BindingFlags.Static)
                ?.Invoke(null, [modelBuilder]);
        }
    }
    
    public static IEnumerable<Type> ModelTypes() 
    {
        yield return typeof(CheckList);
    }

    
}