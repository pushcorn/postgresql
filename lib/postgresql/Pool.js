module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Pool"))
        .staticProperty ("shared", "postgresql.Pool")

        .field ("[database]", "string", "The database name.", nit.os.userInfo ().username)
        .field ("[user]", "string", "The database username.")
        .field ("[password]", "string", "The database password.")
        .field ("[host]", "string", "The database hostname.", "localhost")
        .field ("[port]", "integer", "The database port.", 5432)
        .field ("timeout", "integer", "The idle timeout in milliseconds for the client.", 30000)
        .field ("size", "integer", "The maximum pool size.", 0)

        .memo ("pool", function ()
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
            let pool = this.pool;

            return {
                totalCount:   pool.totalCount,
                waitingCount: pool.waitingCount,
                idleCount:    pool.idleCount
            };
        })

        .onConstruct (function ()
        {
            if (!Self.shared)
            {
                Self.shared = this;
            }
        })
        .method ("connect", async function ()
        {
            return await this.pool.connect ();
        })
        .method ("end", async function ()
        {
            for (let client of this.pool._clients)
            {
                try
                {
                    await client.release ();
                }
                catch (e)
                {
                }
            }

            await this.pool.end ();

            return this;
        })
    ;
};
