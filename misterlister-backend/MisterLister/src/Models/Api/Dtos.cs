using MisterLister.Models.Database;

#nullable disable

namespace MisterLister.Models.Api;

public class SaveListDTO
{
    public CheckList? New { get; set; }
    public CheckList? Old { get; set; }
}