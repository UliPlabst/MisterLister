using System.Linq;
using System.Collections.Generic;
using System.Security.Cryptography;

namespace MisterLister.Misc;

public class ThreeWayMergeHelper<T>(
    T persisted,
    T @new,
    T old
)
{
    private T _persisted = persisted;
    private T _new       = @new;
    private T _old       = old;
    
    public T Persisted => _persisted;
    public T New       => _new;
    public T Old       => _old;
    
    public void Set(T persisted, T @new, T old)
    {
        _persisted = persisted;
        _new       = @new;
        _old       = old;
    }
    
    public UpdateKind GetUpdateKind<TProp>(
        Func<T, TProp> selector,
        bool treatSameValueConflictAsUnchanged = false
    )
    {
        var newValue       = selector(_new);
        var oldValue       = selector(_old);
        if(Object.Equals(newValue, oldValue))
            return UpdateKind.Unchanged;
        var persistedValue = selector(_persisted);
        if(treatSameValueConflictAsUnchanged && Object.Equals(newValue, persistedValue))
            return UpdateKind.Unchanged;
        if(Object.Equals(oldValue, persistedValue))
            return UpdateKind.Updated;
        return UpdateKind.Conflict;
    }
    
    public bool Update<TProp>(
        Func<T, TProp> selector,
        Action<T, TProp> onUpdate,
        Action<T, TProp>? onConflict = null,
        bool treatSameValueConflictAsUnchanged = false
    )
    {
        onConflict ??= onUpdate;
        var kind     = GetUpdateKind(selector, treatSameValueConflictAsUnchanged: treatSameValueConflictAsUnchanged);
        var newValue = selector(_new);
        switch(kind)
        {
            case UpdateKind.Updated:
                onUpdate(_persisted, newValue);
                break;
            case UpdateKind.Conflict:
                onConflict(_persisted, newValue);
                break;
        }
        return kind != UpdateKind.Unchanged;
    }

    public bool UpdateList<TEl, TId>(
        Func<T, ICollection<TEl>> selector,
        Func<TEl, TId> idSelector,
        Func<ThreeWayMergeHelper<TEl>, bool> onUpdate,
        Func<ICollection<TEl>, TEl, bool>? onAdd,
        Func<ICollection<TEl>, TEl, bool>? onRemove
    ) where TEl: class 
      where TId: notnull
    {
        onAdd ??= static (l, e) =>
        {
            l.Add(e);
            return true;
        };
        onRemove ??= static (l, e) =>
        {
            l.Remove(e);
            return true;
        };

        var persistedList = selector(_persisted);
        
        var persistedItems = persistedList.ToDictionary(idSelector);
        var newList        = selector(_new);
        var oldItems       = selector(_old).ToDictionary(idSelector);

        var helper = new ThreeWayMergeHelper<TEl>(null!, null!, null!);
        var changed = false;
        foreach(var n in newList)
        {
            var id = idSelector(n);
            var old = oldItems.GetValueOrDefault(id);
            if(old == null)
            {
                var r = onAdd(persistedList, n);
                changed = changed || r;
            }
            else
            {
                if(!persistedItems.TryGetValue(id, out var p))
                    throw new InvalidOperationException("Item to update not found in persisted list");
                    
                helper.Set(p, n, old);
                var r = onUpdate(helper);
                changed = changed || r;
                persistedItems.Remove(id);
            }
            
        }
        
        foreach(var p in persistedItems)
        {
            var r = onRemove(persistedList, p.Value);
            changed = changed || r;
        }
        return changed;
    }
}

public enum UpdateKind
{
    Unchanged,
    Updated,
    Conflict
}