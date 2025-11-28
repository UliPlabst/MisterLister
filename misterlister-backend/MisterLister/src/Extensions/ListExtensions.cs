using System;
using System.Collections.Generic;

public static class ListExtensions
{
    public static void SafeInsert<T>(this List<T> list, int index, T item)
    {
        if (list == null) throw new ArgumentNullException(nameof(list));

        if (index < 0)
            throw new ArgumentOutOfRangeException(nameof(index), "Index must be non-negative.");

        if (index < list.Count)
            list.Insert(index, item);
        else
            list.Add(item);
    }
    
    public static void ForEach<T>(this List<T> list, Action<T, int> action)
    {
        if (list == null) 
            throw new ArgumentNullException(nameof(list));
        if (action == null) 
            throw new ArgumentNullException(nameof(action));

        for (int i = 0; i < list.Count; i++)
        {
            action(list[i], i);
        }
    }
    
    public static IEnumerable<(T item, int index)> Enumerate<T>(this IEnumerable<T> list)
    {
        if (list == null) 
            throw new ArgumentNullException(nameof(list));

        var i = 0;
        foreach(var e in list)
        {
            yield return (e, i);
            i++;
        }
    }
}