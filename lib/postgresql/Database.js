module.exports = function (nit, postgresql, Self)
{
    const writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("postgresql.Database"))
        .m ("error.database_error", "Database error: %{reason}")
        .m ("debug.statement", "(time: %{time})\n%{statement}")
        .plugin ("logger")
        .use ("nit.utils.String")
        .use ("nit.utils.Colorizer")
        .use ("postgresql.Pool")
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
        .field ("pooling", "boolean|string", "Whether to enable the connection pooling.",
        {
            setter: function (v)
            {
                return v === true ? "main" : v;
            }
        })
        .field ("poolSize", "integer", "The maximum pool size.", 100)

        .defineInnerClass ("Registry", "postgresql.registries.Cached", Registry =>
        {
            Registry
                .field ("<db>", "postgresql.Database", { enumerable: false })
                .method ("lookup", function (name)
                {
                    let self = this;
                    let Model = Registry.superclass.prototype.lookup.call (self, name);

                    return (Model.db = self.db) && Model;
                })
            ;
        })

        .staticMemo ("shared", () => new Self)
        .staticProperty ("nextId", "integer", 1, { writer })
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
        .property ("pool", "postgresql.Pool", function (prop, owner)
        {
            let opts = owner.toPojo ();

            opts.size = opts.poolSize;

            return Self.Pool.get (opts.pooling, opts);
        })
        .memo ("registry", db => new Self.Registry (db))
        .getter ("lookup", "registry.lookup")

        .onPostConstruct (function ()
        {
            let db = this;
            let id = Self.nextId;
            let color = Self.nextColor (id);

            Self.nextId = writer.value ((id + 1) % 0xfffffff);
            db.id = writer.value (nit.lpad (id.toString (16), 7));
            db.logColor = writer.value (color);
        })
        .defineLogger (Logger =>
        {
            Logger
                .onColorForLevel (function (db, level)
                {
                    return this.constructor.colorMap[level] || db.logColor;
                })
                .onFormatLevel (function (db, level)
                {
                    return `[${level.toUpperCase ()}] ` + (level == "debug" ? `(${db.constructor.name}@${db.id}) ` : "");
                })
            ;
        })
        .staticMethod ("nextColor", function (id)
        {
            let colors = Self.colors;
            let index = id % colors.length;

            return colors.splice (index, 1)[0];
        })
        .typedMethod ("find",
            {
                table: "string", matches: "dto", otherClauses: "string", query: "postgresql.queries.Select"
            },
            async function (table, matches, otherClauses, query)
            {
                query = query || new Self.Select;
                query.Limit (1);

                return (await this.select (table, matches, otherClauses, query))[0];
            }
        )
        .typedMethod ("select",
            {
                table: "string", matches: "dto", otherClauses: "string", query: "postgresql.queries.Select"
            },
            async function (table, matches, otherClauses, query)
            {
                query = query || new Self.Select;

                if (table) { query.From (table); }
                if (matches) { nit.each (matches, (v, k) => (k.length ? query.Where (k, v) : query.WhereExpr (v))); }
                if (otherClauses) { query.Append (otherClauses); }

                return (await this.execute (query)).rows;
            }
        )
        .typedMethod ("update",
            {
                table: "string", values: "dto", matches: "dto", query: "postgresql.queries.Update"
            },
            async function (table, values, matches, query)
            {
                query = query || new Self.Update;

                if (table) { query.Table (table); }
                if (matches) { nit.each (matches, (v, k) => (k.length ? query.Where (k, v) : query.WhereExpr (v))); }
                if (values) { nit.each (values, (v, k) => query.SetAny (k, v)); }

                return (await this.execute (query)).rowCount;
            }
        )
        .typedMethod ("insert",
            {
                table: "string", values: "dto", query: "postgresql.queries.Insert"
            },
            async function (table, values, query)
            {
                query = query || new Self.Insert;

                if (table) { query.Table (table); }
                if (values) { nit.each (values, (v, k) => query.ValueAny (k, v)); }

                return (await this.execute (query)).rowCount;
            }
        )
        .typedMethod ("upsert",
            {
                table: "string", values: "dto", matches: "dto", query: "postgresql.queries.Insert"
            },
            async function (table, values, matches, query)
            {
                query = query || new Self.Insert;

                if (table) { query.Table (table); }
                if (values) { nit.each (values, (v, k) => query.ValueAny (k, v)); }
                if (matches) { nit.each (matches, (v, k) => query.ConflictBy (k, { value: v })); }

                return (await this.execute (query)).rowCount;
            }
        )
        .typedMethod ("delete",
            {
                table: "string", matches: "dto", query: "postgresql.queries.Delete"
            },
            async function (table, matches, query)
            {
                query = query || new Self.Delete;

                if (table) { query.Table (table); }
                if (matches) { nit.each (matches, (v, k) => (k.length ? query.Where (k, v) : query.WhereExpr (v))); }

                return (await this.execute (query)).rowCount;
            }
        )
        .method ("listen", async function (channel)
        {
            return await this.query ("LISTEN @1", channel);
        })
        .method ("unlisten", async function (channel)
        {
            return await this.query ("UNLISTEN @1", channel);
        })
        .method ("notify", async function (channel, payload)
        {
            if (nit.is.undef (payload))
            {
                return await this.query ("NOTIFY @1", channel);
            }
            else
            {
                return await this.query ("NOTIFY @1, &2", channel, nit.serialize (payload));
            }
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
        .method ("values", async function (statement, ...params) // eslint-disable-line no-unused-vars
        {
            return (await this.fetchAll (...arguments)).map (row => nit.values (row)[0]);
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
        .method ("transact", async function (work, ignoreError)
        {
            let self = this;

            try
            {
                await self.begin ();

                return await work (self);
            }
            catch (e)
            {
                await self.rollback ();

                if (ignoreError)
                {
                    self.error (e);
                }
                else
                {
                    self.throw ({ code: "error.database_error", reason: e.message, cause: e });
                }
            }
            finally
            {
                await self.commit ();
            }
        })
        .method ("acquire", async function ()
        {
            let self = this;
            let db = new Self;

            db.pooling = self.pooling;
            db.pool = self.pool;

            return await db.connect ();
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

                let startTime = Date.now ();
                let result = await self.client.query (statement);

                self.debug ("debug.statement", { time: (Date.now () - startTime) / 1000, statement });

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
                self.throw ({ code: "error.database_error", reason: e.message + ` (Statement: ${statement})`, cause: e });
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
                    await nit.invoke.silent ([this, "rollback"]);
                }

                if (client.release)
                {
                    await nit.invoke.silent ([client, "query"], "DISCARD ALL");
                    await nit.invoke.silent ([client, "release"]);
                }
                else
                {
                    await client.end ();
                    await nit.invoke.silent ([client, "end"]);
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
                await table.create ();
            }

            for (let table of tables)
            {
                await table.createConstraints ();
            }

            for (let table of tables)
            {
                await table.createIndexes ();
            }

            return models;
        })
        .method ("dropTables", async function (...models)
        {
            let db = this;

            models = models.map (m => db.lookup (nit.is.func (m) ? m.name : m));

            let tables = nit.array (models.map (m => m.tables), true);

            for (let table of tables)
            {
                await table.drop ();
            }
        })
    ;
};
