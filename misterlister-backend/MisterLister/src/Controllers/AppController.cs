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
        var list = await _db.CheckLists.FirstOrDefaultAsync(e => e.Id == id)
            ?? throw ApiError.NotFound();
        return list;
    }
    
    [HttpDelete("api/v1/list/{id}")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<CheckList> DeleteList(Guid id)
    {
        var list = await _db.CheckLists.FirstOrDefaultAsync(e => e.Id == id)
            ?? throw ApiError.NotFound();
        _db.CheckLists.Remove(list);
        await _db.SaveChangesAsync();
        return list;
    }
    
    [HttpPost("api/v1/list/{id}")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<CheckList> SaveList(Guid id, [FromBody] SaveListDTO dto)
    {
        var user = dto.User;
        if(String.IsNullOrEmpty(user))
            throw new ApiError(ErrorCode.NoUser, "No user provided");
        var existing = await _db.CheckLists.FindAsync(dto.New.Id);
        
        if(dto.Old != null && dto.Old.Id != dto.New.Id)
            throw new ApiError(ErrorCode.BadRequest, "Old and new list IDs do not match");

        var context = new InvocationContext(user);
        
        CheckList result;
        if(dto.Old == null)
        {
            dto.New.CreatedBy = user;
            dto.New.Created   = DateTime.UtcNow;
            dto.New.LastModifiedBy = user;
            dto.New.LastModified   = DateTime.UtcNow;
            _db.CheckLists.Add(dto.New);
            result = dto.New;
        }
        else
        {
            if(existing == null)
                throw new ApiError(ErrorCode.BadRequest, "List does not exist but old version was provided");
            existing.Merge(dto.New, dto.Old, context);
            result = existing;
        }

        result.RowVersion++;
        await _db.SaveChangesAsync();
        return result;
    }
    
    [HttpPost]
    [Route("api/v1/list")]
    [EnableRateLimiting(Constants.RATELIMIT_POLICY)]
    public async Task<IEnumerable<CheckList>> SyncLists([FromBody] List<CheckUpdateDTO> requests)
    {
        var ids = requests.Select(r => r.ListId).ToList();
        var lists = await _db.CheckLists
            .Where(l => ids.Contains(l.Id))
            .ToListAsync();
            
        return lists.Where(e => e.LastModified > requests.First(r => r.ListId == e.Id).LastModified);
    }
}