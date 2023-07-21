module.exports = function (nit, postgresql, Self)
{
    const writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("postgresql.Database"))
        .m ("error.database_error", "Database error: %{reason}")
        .m ("debug.statement", "%{statement}")
        .plugin ("logger", { stackTrace: false })
        .use ("nit.utils.String")
        .use ("nit.utils.Colorizer")
        .use ("postgresql.Query")
        .use ("postgresql.queries.Select")
        .use ("postgresql.queries.Update")
        .use ("postgresql.queries.Insert")
        .use ("postgresql.queries.Upsert")
        .use ("postgresql.queries.Delete")
        .field ("[database]", "string", "The database name.", nit.os.userInfo ().username)
        .field ("[user]", "string", "The database username.")
        .field ("[password]", "string", "The database password.")
        .field ("[host]", "string", "The database hostname.", "localhost")
        .field ("[port]", "integer", "The database port.", 5432)
        .field ("timeout", "integer", "The idle timeout in milliseconds for the client.", 30000)
        .field ("pooling", "boolean", "Whether to enable the connection pooling.")
        .field ("poolSize", "integer", "The maximum pool size.", 100)

        .defineInnerClass ("Registry", "postgresql.registries.Cached", Registry =>
        {
            Registry
                .field ("<db>", "postgresql.Database")
                .method ("lookup", function (name)
                {
                    let self = this;
                    let Model = Registry.superclass.prototype.lookup.call (self, name);

                    return (Model.db = self.db) && Model;
                })
            ;
        })

        .staticMemo ("shared", () => new Self)
        .staticProperty ("pool", "postgresql.Pool")
        .staticProperty ("colors...", "string",
        {
            getter: function (v)
            {
                if (!v.length)
                {
                    v.push (...Self.Colorizer.FG_COLORS);
                }

                return v;
            }
        })
        .property ("id", "string", { writer })
        .property ("logColor", "string", { writer })
        .property ("client", "any")
        .property ("transacting", "boolean")
        .memo ("registry", db => new Self.Registry (db))
        .memo ("pool", function ()
        {
            let opts = this.toPojo ();

            opts.size = opts.poolSize;

            return (Self.pool = Self.pool || new postgresql.Pool (opts));
        })
        .getter ("lookup", "registry.lookup")

        .onPostConstruct (function ()
        {
            let db = this;
            let id = nit.do (nit.uuid (), id => id.slice (0, 4) + id.slice (-3));
            let color = Self.nextColor (Self.String.intHash (`${db.constructor.name}@${id}`));

            db.id = writer.value (id);
            db.logColor = writer.value (color);
        })
        .onLogLevelPrefix (function (level)
        {
            return `[${level.toUpperCase ()}] ` + (level == "debug" ? `(${this.constructor.name}@${this.id}) ` : "");
        })
        .onLogLevelColor (function (level)
        {
            let self = this;
            let cls = self.constructor;

            return cls.logger.levelColors[level] || self.logColor;
        })
        .staticMethod ("nextColor", function (hash)
        {
            let colors = Self.colors;
            let index = Math.abs (hash) % colors.length;

            return colors.splice (index, 1)[0];
        })

        .method ("find", async function (table, matches, otherClauses, query)
        {
            ({ table, matches, otherClauses, query } = nit.typedArgsToObj (arguments,
            {
                table: "string",
                matches: "dto",
                otherClauses: "string",
                query: Self.Select
            }));

            query = query || new Self.Select;
            query.$limit (1);

            return (await this.select (table, matches, otherClauses, query))[0];
        })
        .method ("select", async function (table, matches, otherClauses, query)
        {
            ({ table, matches, otherClauses, query } = nit.typedArgsToObj (arguments,
            {
                table: "string",
                matches: "dto",
                otherClauses: "string",
                query: Self.Select
            }));

            query = query || new Self.Select;

            if (table) { query.$from (table); }
            if (matches) { nit.each (matches, (v, k) => query.$where (k, v)); }
            if (otherClauses) { query.$append (otherClauses); }

            return (await this.execute (query)).rows;
        })
        .method ("update", async function (table, values, matches, query)
        {
            ({ table, values, matches, query } = nit.typedArgsToObj (arguments,
            {
                table: "string",
                values: "dto",
                matches: "dto",
                query: Self.Update
            }));

            query = query || new Self.Update;

            if (table) { query.$table (table); }
            if (matches) { nit.each (matches, (v, k) => query.$where (k, v)); }
            if (values) { nit.each (values, (v, k) => query.$setAny (k, v)); }

            return (await this.execute (query)).rowCount;
        })
        .method ("insert", async function (table, values, query)
        {
            ({ table, values, query } = nit.typedArgsToObj (arguments,
            {
                table: "string",
                values: "dto",
                query: Self.Insert
            }));

            query = query || new Self.Insert;

            if (table) { query.$table (table); }
            if (values) { nit.each (values, (v, k) => query.$valueAny (k, v)); }

            return (await this.execute (query)).rowCount;
        })
        .method ("upsert", async function (table, values, matches, query)
        {
            ({ table, values, matches, query } = nit.typedArgsToObj (arguments,
            {
                table: "string",
                values: "dto",
                matches: "dto",
                query: Self.Insert
            }));

            query = query || new Self.Insert;

            if (table) { query.$table (table); }
            if (values) { nit.each (values, (v, k) => query.$valueAny (k, v)); }
            if (matches) { nit.each (matches, (v, k) => query.$conflictBy (k, { value: v })); }

            return (await this.execute (query)).rowCount;
        })
        .method ("delete", async function (table, matches, query)
        {
            ({ table, matches, query } = nit.typedArgsToObj (arguments,
            {
                table: "string",
                matches: "dto",
                query: Self.Delete
            }));

            query = query || new Self.Delete;

            if (table) { query.$table (table); }
            if (matches) { nit.each (matches, (v, k) => query.$where (k, v)); }

            return (await this.execute (query)).rowCount;
        })
        .method ("query", async function (statement, ...params)
        {
            if (nit.is.str (statement))
            {
                statement = postgresql.format (statement, ...params);
            }

            return await this.execute (statement);
        })
        .method ("fetchAll", async function (statement, ...params) // eslint-disable-line no-unused-vars
        {
            return (await this.query (...arguments)).rows;
        })
        .method ("fetch", async function (statement, ...params) // eslint-disable-line no-unused-vars
        {
            return (await this.fetchAll (...arguments))[0];
        })
        .method ("value", async function (statement, ...params) // eslint-disable-line no-unused-vars
        {
            return nit.values (await this.fetch (...arguments))[0];
        })
        .method ("begin", async function ()
        {
            if (!this.transacting)
            {
                await this.query ("BEGIN");
            }

            return this;
        })
        .method ("commit", async function ()
        {
            if (this.transacting)
            {
                await this.query ("COMMIT");
            }

            return this;
        })
        .method ("rollback", async function ()
        {
            if (this.transacting)
            {
                await this.query ("ROLLBACK");
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

                this.throw ({ code: "error.database_error", reason: e.message, cause: e });
            }
            finally
            {
                await this.commit ();
            }
        })
        .method ("execute", async function (statement)
        {
            if (statement instanceof Self.Query)
            {
                statement = statement.sql;
            }

            let self = this;

            try
            {
                await self.connect ();

                self.debug ("debug.statement", { statement });

                let result = await self.client.query (statement);

                if (result.command == "BEGIN")
                {
                    self.transacting = true;
                }
                else
                if (self.transacting
                    && (result.command == "COMMIT" || result.command == "ROLLBACK"))
                {
                    self.transacting = false;
                }

                for (let row of nit.array (result.rows))
                {
                    for (let k in row)
                    {
                        if (nit.is.arr (row[k]))
                        {
                            row[k] = row[k].map (postgresql.parseValue);
                        }
                    }
                }

                return result;
            }
            catch (e)
            {
                self.throw ({ code: "error.database_error", reason: e.message, cause: e });
            }
        })
        .method ("connect", async function ()
        {
            let self = this;
            let client = self.client;

            if (!client)
            {
                if (self.pooling)
                {
                    client = await self.pool.connect ();
                }
                else
                {
                    client = new postgresql.pg.Client (
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

                self.client = client;

                nit.shutdown (self.disconnect.bind (self));
            }

            return self;
        })
        .method ("disconnect", async function ()
        {
            let client = this.client;

            if (client)
            {
                if (this.transacting)
                {
                    await this.rollback ();
                }

                if (client.release)
                {
                    await client.query ("DISCARD ALL");
                    await client.release ();
                }
                else
                {
                    await client.end ();
                }

                this.client = undefined;
            }

            return this;
        })
        .method ("createTables", async function (...models)
        {
            let db = this;
            let tsort = nit.new ("nit.utils.Tsort");

            models = models.map (m => db.lookup (nit.is.func (m) ? m.name : m));

            for (let cls of models)
            {
                tsort.add (cls, cls.fields.filter (f => f.modelIsReference).map (f =>
                {
                    if (!models.includes (f.modelClass))
                    {
                        models.push (f.modelClass);
                    }

                    let joinModelClass = f.relationship?.joinModelClass;

                    if (joinModelClass && !models.includes (joinModelClass))
                    {
                        models.push (joinModelClass);
                    }

                    return f.modelClass;
                }));
            }

            try
            {
                models = tsort.sort ();
            }
            catch (e)
            {
            }

            let tables = models.map (m => m.table);

            for (let table of tables)
            {
                await table.create (db);
            }

            for (let table of tables)
            {
                for (let c of table.constraints)
                {
                    await db.query (c.sql);
                }
            }

            for (let table of tables)
            {
                for (let i of table.indexes)
                {
                    await db.query (i.sql);
                }
            }

            return models;
        })
        .method ("dropTables", async function (...models)
        {
            let db = this;

            let tables = nit.array (models.map (m => m.tables), true);

            for (let table of tables)
            {
                await table.drop (db);
            }
        })
    ;
};
