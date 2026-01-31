using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure.Internal;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using MisterLister.Misc;

namespace MisterLister.Models.Database;

#nullable disable

[Index(nameof(Key), IsUnique = true)]
public class CheckList
{
    [Key, JsonIgnore]
    public long Id { get; set; }
    public Guid Key { get; set; }               
    public string Name { get; set; }
    public string Description { get; set; }
    public string CreatedBy { get; set; }
    public DateTime Created { get; set; }      = DateTime.UtcNow;
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public string LastModifiedBy { get; set; }
    public DateTime? Deleted { get; set; }
    public string? DeletedBy { get; set; }
    public string EncryptedKey { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual List<ListItem> Items { get; set; }

    public static void ConfigureModel(ModelBuilder mb)
    {
        var b = mb.Entity<CheckList>();
        b.Property(e => e.RowVersion)
            .IsConcurrencyToken();
        b.HasMany(e => e.Items)
            .WithOne(e => e.CheckList)
            .HasForeignKey(e => e.CheckListId)
            .HasPrincipalKey(e => e.Id)
            .OnDelete(DeleteBehavior.Cascade);
    }
    
    public void FillParentItemIds()
    {
        foreach(var (item, i) in Items.Enumerate())
        {
            item.ParentItemId = i switch
            {
                0 => null,
                _ => Items[i - 1].Key
            };
        }
    }
    
    public void OrderItems()
    {
        Items = GetOrderedItems().ToList();
    }
    
    private IEnumerable<ListItem> GetOrderedItems()
    {
        var curr = Items
            .Where(i => i.ParentItemId == null)
            .OrderByDescending(e => e.LastModified)
            .ToList();
        foreach (var item in curr)
        {
            yield return item;
        }
        var ids = curr.Select(i => i.Key).ToHashSet();
        
        do
        {
            var next = Items
                .Where(i => i.ParentItemId.HasValue && ids.Contains(i.ParentItemId.Value) && !ids.Contains(i.Key))
                .OrderByDescending(e => e.LastModified)
                .ToList();
            if(!next.Any())
                break;
            foreach (var item in next)
            {
                yield return item;
                ids.Add(item.Key);
            }
            curr = next;
        } while (curr.Any());
    }
    
    public void Merge(CheckList @new, CheckList old, InvocationContext context)
    {
        if(@new.Key != Key)
            throw new ArgumentException("Cannot merge lists with different IDs");
        
        // Order items first before filling parent IDs to ensure correct order from DB
        OrderItems();
        FillParentItemIds();
        @new.FillParentItemIds();
        old.FillParentItemIds();

        var helper = new ThreeWayMergeHelper<CheckList>(this, @new, old);
        var listChanged = false;
        var r = helper.Update(
            static e => e.Name,
            static (o, n) =>
            {
                o.Name = n;
            }
        );
        listChanged = listChanged || r;
        
        r = helper.Update(
            static e => e.Description,
            static (o, n) =>
            {
                o.Description = n;
            }
        );
        listChanged = listChanged || r;

        r = helper.UpdateList(
            static e => e.Items,
            static e => e.Key,
            onUpdate: h =>
            {
                var changed = false;
                var r = h.Update(
                    static e => (e.Name, e.State),
                    onUpdate: (o, n) =>
                    {
                        o.Name = n.Name;
                        o.SetState(n.State, context);
                    },
                    onConflict: (o, n) =>
                    {
                        var nameChanged = h.GetUpdateKind(static e => e.Name);
                        if(nameChanged != UpdateKind.Unchanged)
                        {
                            var clone = h.New.Clone();
                            clone.LastModified   = context.InvocationTime;
                            clone.ParentItemId   = o.ParentItemId;
                            helper.Persisted.Items.Insert(
                                helper.Persisted.Items.IndexOf(o) + 1,
                                clone
                            );
                            return;
                        }

                        h.Update(
                            static e => e.State,
                            onUpdate: (o2, n2) =>
                            {
                                o2.SetState(n2, context);
                            },
                            onConflict: (o2, n2) =>
                            {
                                if(h.New.State == ItemState.Deleted && h.Old.State == ItemState.Completed && h.Persisted.State == ItemState.Idle)
                                {
                                    //user has deleted but other user has changed it to idle, in this case keep it idle
                                    return;
                                }
                                o2.SetState(n2, context);
                            }
                        );
                    }
                );
                changed = changed || r;

                r = h.Update(e => e.ParentItemId,
                    onUpdate: (o, n) =>
                    {
                        o.ParentItemId = n;
                    }
                );
                changed = changed || r;

                return changed;
            },
            onAdd: static (l, e) =>
            {
                l.Add(e);
                return true;
            },
            onRemove: static (l, e) =>
            {
                return true;
                // e.Deleted = context.InvocationTime;
                // e.DeletedBy = context.User;
                // return true;
            }
        );
        listChanged = listChanged || r;

        if (listChanged)
            LastModified = context.InvocationTime;
        OrderItems();
    }
}

public enum ItemState
{
    Idle,
    Completed,
    Deleted
}

[Index(nameof(Key), IsUnique = true)]
public class ListItem
{
    [Key, JsonIgnore]
    public long Id { get; set; }
    public Guid Key { get; set; }
    public string Name { get; set; }
    public ItemState State { get; set; }

    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public string LastModifiedBy { get; set; }
    public DateTime CreatedAt { get; set; }    = DateTime.UtcNow;
    public string CreatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string DeletedBy { get; set; }
    
    [JsonIgnore]
    public Guid? ParentItemId { get; set; }
    
    public long CheckListId { get; set; }
    [JsonIgnore]
    public virtual CheckList CheckList { get; set; }
    
    public void SetState(ItemState state, InvocationContext context)
    {
        if(state == ItemState.Idle)
        {
            CompletedAt = null;
            CompletedBy = null;
            DeletedAt   = null;
            DeletedBy   = null;
        }
        else if(state == ItemState.Completed)
        {
            CompletedAt = context.InvocationTime;
            DeletedAt   = null;
            DeletedBy   = null;
        }
        else if(state == ItemState.Deleted)
        {
            DeletedAt = context.InvocationTime;
        }
        State = state;
    }
    
    
    public ListItem Clone()
    {
        return new ListItem
        {
            Key             = Guid.NewGuid(),
            Name           = Name,
            State          = State,
            CompletedAt    = CompletedAt,
            CompletedBy    = CompletedBy,
            LastModified   = LastModified,
            LastModifiedBy = LastModifiedBy,
            CreatedAt      = CreatedAt,
            CreatedBy      = CreatedBy,
            DeletedAt      = DeletedAt,
            DeletedBy      = DeletedBy,
        };
    }
}
