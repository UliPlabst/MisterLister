
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MisterLister.Json;

public class ExceptionJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
        => typeof(Exception).IsAssignableFrom(typeToConvert);

    public override JsonConverter? CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        var converterType = typeof(ExceptionJsonConverter<>).MakeGenericType(typeToConvert);
        return (JsonConverter?)Activator.CreateInstance(converterType);
    }
}

public class ExceptionJsonConverter<T>: JsonConverter<T> where T : Exception
{
    readonly static string[] ExceptionPropNames = [
        nameof(Exception.Message),
        nameof(Exception.StackTrace),
    ];

    PropertyInfo[] _properties;
    public ExceptionJsonConverter()
    {
        //get properties defined in T but not on base type
        _properties = typeof(T).GetProperties()
            .Where(p => 
                (p.DeclaringType == typeof(T) && typeof(T) != typeof(Exception))
                || (p.DeclaringType == typeof(Exception) && ExceptionPropNames.Contains(p.Name))
            )
            .ToArray();
    }
    
    public override T? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => throw new NotImplementedException();

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        foreach(var prop in _properties)
        {
            var propValue = prop.GetValue(value);
            var name = options.PropertyNamingPolicy?.ConvertName(prop.Name) ?? prop.Name;
            writer.WritePropertyName(name);
            JsonSerializer.Serialize(writer, propValue, prop.PropertyType, options);
        }
        writer.WriteEndObject();
    }
}