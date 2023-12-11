module.exports = function (nit, postgresql, Self)
{
    const writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("postgresql.Pool"))
        .use ("postgresql.Database")
        .field ("[database]", "string", "The database name.", nit.os.userInfo ().username)
        .field ("[user]", "string", "The database username.")
        .field ("[password]", "string", "The database password.")
        .field ("[host]", "string", "The database hostname.", "localhost")
        .field ("[port]", "integer", "The database port.", 5432)
        .field ("timeout", "integer", "The idle timeout in milliseconds for the client.", 30000)
        .field ("size", "integer", "The maximum pool size.")
        .property ("id", "string", { writer })

        .defineInnerClass ("Stats", Stats =>
        {
            Stats
                .field ("total", "integer")
                .field ("waiting", "integer")
                .field ("idle", "integer")
                .field ("size", "integer")
            ;
        })
        .staticProperty ("registry", "object")
        .staticMethod ("get", function (id, opts)
        {
            id = nit.coalesce (id, "main");

            return Self.registry[id] = Self.registry[id] || nit.assign (new Self (opts), { id: writer.value (id) });
        })
        .memo ("pgPool", function ()
        {
            let self = this;

            return new postgresql.pg.Pool (
            {
                database: self.database,
                user: self.user,
                password: self.password,
                host: self.host,
                port: self.port,
                idleTimeoutMillis: self.timeout,
                max: self.size
            });
        })
        .getter ("stats", function ()
        {
            let pool = this.pgPool;

            return new Self.Stats (
            {
                total: pool.totalCount,
                waiting: pool.waitingCount,
                idle: pool.idleCount,
                size: this.size
            });
        })

        .onConstruct (function ()
        {
            let self = this;

            nit.shutdown (self.end.bind (self));
        })
        .method ("connect", async function ()
        {
            return await this.pgPool.connect ();
        })
        .method ("end", async function ()
        {
            for (let client of this.pgPool._clients)
            {
                try
                {
                    await client.release ();
                }
                catch (e)
                {
                }
            }

            await this.pgPool.end ();

            return this;
        })
    ;
};
