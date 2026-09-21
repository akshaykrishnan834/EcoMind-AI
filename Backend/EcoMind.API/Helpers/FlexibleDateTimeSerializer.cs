using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using System.Globalization;

namespace EcoMind.API.Helpers
{
    public class FlexibleDateTimeSerializer : SerializerBase<DateTime>
    {
        public override DateTime Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
        {
            var reader = context.Reader;
            var currentType = reader.CurrentBsonType;

            switch (currentType)
            {
                case BsonType.DateTime:
                    var ms = reader.ReadDateTime();
                    return DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;

                case BsonType.String:
                    var str = reader.ReadString();
                    if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
                    {
                        return parsed;
                    }
                    return DateTime.Parse(str);

                case BsonType.Document:
                    var doc = BsonDocumentSerializer.Instance.Deserialize(context, args);
                    if (doc.Contains("$date"))
                    {
                        var dateVal = doc["$date"];
                        if (dateVal.IsBsonDateTime)
                        {
                            return dateVal.ToUniversalTime();
                        }
                        if (dateVal.IsString && DateTime.TryParse(dateVal.AsString, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var d))
                        {
                            return d;
                        }
                        if (dateVal.IsInt64)
                        {
                            return DateTimeOffset.FromUnixTimeMilliseconds(dateVal.AsInt64).UtcDateTime;
                        }
                        if (dateVal.IsBsonDocument && dateVal.AsBsonDocument.Contains("$numberLong"))
                        {
                            var longMs = long.Parse(dateVal.AsBsonDocument["$numberLong"].AsString);
                            return DateTimeOffset.FromUnixTimeMilliseconds(longMs).UtcDateTime;
                        }
                    }
                    return default;

                case BsonType.Int64:
                    return DateTimeOffset.FromUnixTimeMilliseconds(reader.ReadInt64()).UtcDateTime;

                case BsonType.Null:
                    reader.ReadNull();
                    return default;

                default:
                    reader.SkipValue();
                    return default;
            }
        }

        public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, DateTime value)
        {
            context.Writer.WriteDateTime(BsonUtils.ToMillisecondsSinceEpoch(value));
        }
    }

    public class FlexibleNullableDateTimeSerializer : SerializerBase<DateTime?>
    {
        public override DateTime? Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
        {
            var reader = context.Reader;
            var currentType = reader.CurrentBsonType;

            switch (currentType)
            {
                case BsonType.Null:
                    reader.ReadNull();
                    return null;

                case BsonType.DateTime:
                    var ms = reader.ReadDateTime();
                    return DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;

                case BsonType.String:
                    var str = reader.ReadString();
                    if (string.IsNullOrWhiteSpace(str))
                    {
                        return null;
                    }
                    if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
                    {
                        return parsed;
                    }
                    return DateTime.Parse(str);

                case BsonType.Document:
                    var doc = BsonDocumentSerializer.Instance.Deserialize(context, args);
                    if (doc.Contains("$date"))
                    {
                        var dateVal = doc["$date"];
                        if (dateVal.IsBsonDateTime)
                        {
                            return dateVal.ToUniversalTime();
                        }
                        if (dateVal.IsString && DateTime.TryParse(dateVal.AsString, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var d))
                        {
                            return d;
                        }
                        if (dateVal.IsInt64)
                        {
                            return DateTimeOffset.FromUnixTimeMilliseconds(dateVal.AsInt64).UtcDateTime;
                        }
                        if (dateVal.IsBsonDocument && dateVal.AsBsonDocument.Contains("$numberLong"))
                        {
                            var longMs = long.Parse(dateVal.AsBsonDocument["$numberLong"].AsString);
                            return DateTimeOffset.FromUnixTimeMilliseconds(longMs).UtcDateTime;
                        }
                    }
                    return null;

                case BsonType.Int64:
                    return DateTimeOffset.FromUnixTimeMilliseconds(reader.ReadInt64()).UtcDateTime;

                default:
                    reader.SkipValue();
                    return null;
            }
        }

        public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, DateTime? value)
        {
            if (value.HasValue)
            {
                context.Writer.WriteDateTime(BsonUtils.ToMillisecondsSinceEpoch(value.Value));
            }
            else
            {
                context.Writer.WriteNull();
            }
        }
    }
}
