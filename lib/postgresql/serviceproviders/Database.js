module.exports = function (nit)
{
    return nit.defineServiceProvider ("postgresql.serviceproviders.Database")
        .provides ("postgresql.Database")
        .field ("[database]", "string?", "The database name.")
        .field ("[user]", "string?", "The database username.")
        .field ("[password]", "string?", "The database password.")
        .field ("[host]", "string?", "The database hostname.")
        .field ("[port]", "integer?", "The database port.")
        .field ("timeout", "integer?", "The idle timeout in milliseconds for the client.")
        .field ("pooling", "boolean|string?", "Whether to enable the connection pooling.")
        .field ("poolSize", "integer?", "The maximum pool size.")
        .onCreate (function (type, ctx)
        {
            return nit.new ("postgresql.Database", this.toPojo ());
        })
        .onDestroy (db => db.disconnect ())
    ;
};
