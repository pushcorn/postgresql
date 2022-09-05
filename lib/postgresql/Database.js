module.exports = function (nit, postgresql)
{
    return nit.defineClass ("postgresql.Database")
        .m ("error.query_failed", "Unable to execute the query.")
        .field ("[database]", "string", "The database name.", nit.os.userInfo ().username)
        .field ("[user]", "string", "The database username.")
        .field ("[password]", "string", "The database password.")
        .field ("[host]", "string", "The database hostname.", "localhost")
        .field ("[port]", "integer", "The database port.", 5432)
        .field ("timeout", "integer", "The idle timeout in milliseconds for the client.", 30000)

        .property ("client", "any")
        .property ("inTransaction", "boolean")

        .method ("select", async function (table, matches, otherClauses)
        {
            let statement = nit.trim.text`
                SELECT *
                FROM @table%{#matches|nit.entries}
                %{$FIRST ? 'WHERE ' : ' AND '}%{k|id} %{v|eq} %{v|literal}%{/}%{#otherClauses}
                %{.}%{/}
            `;

            let result = await this.query (statement, { table, matches, otherClauses });

            return result.rows;
        })
        .method ("find", async function (table, matches, otherClauses)
        {
            return (await this.select (table, matches, otherClauses))[0];
        })
        .method ("update", async function (table, values, matches)
        {
            let statement = nit.trim.text`
                UPDATE @table
                SET %{#values|nit.entries}%{$FIRST ? '' : ', '}%{k|id} = %{v|literal}%{/}
                %{#matches|nit.entries}%{$FIRST ? 'WHERE ' : ' AND '}%{k|id} %{v|eq} %{v|literal}%{/}
            `;

            let result = await this.query (statement, { table, values, matches });

            return result.rowCount;
        })
        .method ("insert", async function (table, values)
        {
            let statement = nit.trim.text`
                INSERT INTO @table (%{#values|nit.entries}%{$FIRST ? '' : ', '}%{k|id}%{/})
                VALUES (%{#values|nit.entries}%{$FIRST ? '' : ', '}%{v|literal}%{/})
            `;

            let result = await this.query (statement, { table, values });

            return result.rowCount;
        })
        .method ("upsert", async function (table, values, matches)
        {
            let allValues = nit.assign ({}, values, matches);

            let statement = nit.trim.text`
                INSERT INTO @table (%{#allValues|nit.entries}%{$FIRST ? '' : ', '}%{k|id}%{/})
                VALUES (%{#allValues|nit.entries}%{$FIRST ? '' : ', '}%{v|literal}%{/})
                ON CONFLICT (%{#matches|nit.entries}%{$FIRST ? '' : ', '}%{k|id}%{/})
                DO UPDATE
                SET %{#values|nit.entries}%{$FIRST ? '' : ', '}%{k|id} = %{v|literal}%{/}
            `;

            let result = await this.query (statement, { table, allValues, values, matches });

            return result.rowCount;
        })
        .method ("delete", async function (table, matches)
        {
            let statement = nit.trim.text`
                DELETE FROM @table
                %{#matches|nit.entries}%{$FIRST ? 'WHERE ' : ' AND '}%{k|id} %{v|eq} %{v|literal}%{/}
            `;

            let result = await this.query (statement, { table, matches });

            return result.rowCount;
        })
        .method ("query", async function (statement, ...params)
        {
            return await this.execute (postgresql.format (statement, ...params));
        })
        .method ("begin", async function ()
        {
            if (!this.inTransaction)
            {
                await this.query ("BEGIN");

                this.inTransaction = true;
            }

            return this;
        })
        .method ("commit", async function ()
        {
            if (this.inTransaction)
            {
                await this.query ("COMMIT");

                this.inTransaction = false;
            }

            return this;
        })
        .method ("rollback", async function ()
        {
            if (this.inTransaction)
            {
                await this.query ("ROLLBACK");

                this.inTransaction = false;
            }

            return this;
        })
        .method ("transact", async function (work)
        {
            try
            {
                await this.begin ();

                return await work (this);
            }
            catch (e)
            {
                await this.rollback ();

                throw e;
            }
            finally
            {
                await this.commit ();
            }
        })
        .method ("execute", async function (statement)
        {
            try
            {
                await this.connect ();

                return await this.client.query (statement);
            }
            catch (e)
            {
                this.throw ({ code: "error.query_failed", message: e.message, cause: e });
            }
        })
        .method ("connect", async function ()
        {
            let self = this;
            let client = self.client;

            if (!client)
            {
                self.client = client = new postgresql.pg.Client (
                {
                    database: self.database,
                    user: self.user,
                    password: self.password,
                    host: self.host,
                    port: self.port,
                    idleTimeoutMillis: self.timeout
                });

                await client.connect ();
            }

            return self;
        })
        .method ("disconnect", async function ()
        {
            let client = this.client;

            if (client)
            {
                let method = client.release || client.end;

                await method.call (client);

                this.client = undefined;
            }

            return this;
        })
    ;
};
