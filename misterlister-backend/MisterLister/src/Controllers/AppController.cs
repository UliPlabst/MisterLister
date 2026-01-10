using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MisterLister.Database;
using MisterLister.Misc;
using MisterLister.Models.Api;
using MisterLister.Models.Database;

namespace MisterLister.Controllers;

public class ApiController(
    ILogger<ApiController> _logger,
    AppDbContext _db
): Controller
{
    [HttpGet("api/v1/list/{id}")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<CheckList> GetList(Guid id)
    {
        var list = await _db.CheckLists
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Key == id)
            ?? throw ApiError.NotFound();
        return list;
    }
    
    [HttpDelete("api/v1/list/{id}")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<CheckList> DeleteList(Guid id)
    {
        var list = await _db.CheckLists
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Key == id)
            ?? throw ApiError.NotFound();
        _db.CheckLists.Remove(list);
        await _db.SaveChangesAsync();
        return list;
    }
    
    [HttpPost("api/v1/list/{id}")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<CheckList> SaveList(Guid id, [FromBody] SaveListDTO dto)
    {
        var existing = await _db.CheckLists
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Key == id);
        var result = SaveList(dto, existing);
        await _db.SaveChangesAsync();
        return result;
    }
    
    private CheckList SaveList(SaveListDTO dto, CheckList? existing)
    {
        var @new = dto.New;
        var old = dto.Old;

        Guid?[] ids = [
            existing?.Key,
            dto.New?.Key,
            dto.Old?.Key
        ];
        if(ids.Where(e => e.HasValue).Distinct().Count() != 1)
            throw new ApiError(ErrorCode.BadRequest, "List ids do not match");
        
        if(@new == null)
            return existing ?? throw new ApiError(ErrorCode.BadRequest, "No new list provided");
            
        if(old != null && old.Key != @new.Key)
            throw new ApiError(ErrorCode.BadRequest, "Old and new list IDs do not match");

        var context = new InvocationContext();
        
        CheckList result;
        if(existing == null)
        {
            @new.Created   = DateTime.UtcNow;
            @new.LastModified   = DateTime.UtcNow;
            _db.CheckLists.Add(@new);
            result = @new;
        }
        else
        {
            if(old == null)
                throw new ApiError(ErrorCode.BadRequest, "No old list provided for existing list");
            existing.Merge(@new, old, context);
            result = existing;
        }

        result.RowVersion++;
        return result;
    }
    
    [HttpPost("api/v1/lists/sync")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<Dictionary<Guid, CheckList>> Sync([FromBody] Dictionary<Guid, SaveListDTO> dtos)
    {
        var ids = dtos.Keys.ToList();
        var existingLists = await _db.CheckLists
            .Include(e => e.Items)
            .Where(e => ids.Contains(e.Key))
            .ToDictionaryAsync(e => e.Key, e => e);
        var res = dtos.ToDictionary(
            pair => pair.Key,
            pair => SaveList(pair.Value, existingLists.GetValueOrDefault(pair.Key))
        );
        await _db.SaveChangesAsync();
        return res;
    }
    
    [HttpGet("api/monitor")]
    public IActionResult Monitor() => Ok();
}