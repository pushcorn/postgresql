module.exports = function (nit, postgresql)
{
    return nit.defineClass ("postgresql.Pool")
        .field ("[database]", "string", "The database name.", nit.os.userInfo ().username)
        .field ("[user]", "string", "The database username.")
        .field ("[password]", "string", "The database password.")
        .field ("[host]", "string", "The database hostname.", "localhost")
        .field ("[port]", "integer", "The database port.", 5432)
        .field ("timeout", "integer", "The idle timeout in milliseconds for the client.", 30000)
        .field ("size", "integer", "The maximum pool size.", 100)

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

        .method ("connect", async function ()
        {
            let db = nit.new ("postgresql.Database", this.toPojo (true));

            db.client = await this.pool.connect ();

            return db;
        })
        .method ("disconnect", async function ()
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
