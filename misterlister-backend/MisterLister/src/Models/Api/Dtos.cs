using MisterLister.Models.Database;

namespace MisterLister.Models.Api;

public class CheckUpdateDTO
{
    public Guid ListId { get; set; }
    public DateTime LastModified { get; set; }
}

public class SaveListDTO
{
    public CheckList New { get; set; }
    public CheckList? Old { get; set; }
    public string User { get; set; }
}