module.exports = function (nit)
{
    return nit.Command.defineCommandPlugin ("postgresql.commandplugins.DatabaseProvider")
        .field ("[property]", "string", "The context property that will hold the database.", "db")
        .field ("[transactional]", "boolean", "Wrap the run method with a transaction.", true)
        .field ("database", "string?", "The database name.")
        .field ("user", "string?", "The database username.")
        .field ("password", "string?", "The database password.")
        .field ("host", "string?", "The database hostname.")
        .field ("port", "integer?", "The database port.")
        .field ("timeout", "integer?", "The idle timeout in milliseconds for the client.")
        .field ("pooling", "boolean?", "Whether to enable the connection pooling.")
        .field ("poolSize", "integer?", "The maximum pool size.")

        .staticMethod ("onUsePlugin", function (cls, plugin)
        {
            cls.Context
                .property (plugin.property, "postgresql.Database")
            ;
        })
        .onPreRun (async function (ctx)
        {
            const cfg = this.toPojo ();
            const db = this.db (ctx, nit.new ("postgresql.Database", cfg));

            if (cfg.transactional)
            {
                await db.begin ();
            }
            else
            {
                await db.connect ();
            }

        })
        .onPostRun (async function (ctx)
        {
            if (this.transactional)
            {
                await this.db (ctx).commit ();
            }
        })
        .onPostFinally (async function (ctx)
        {
            await this.db (ctx)?.disconnect ();
        })
        .method ("db", function (ctx, instance)
        {
            return ctx[this.property] = instance || ctx[this.property];
        })
    ;
};
