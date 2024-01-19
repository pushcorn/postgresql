nit.test.Strategy
    .property ("models...", "string")
    .memo ("postgresql", () => nit.require ("postgresql"))
    .memo ("Model", () => nit.require ("postgresql.Model"))
    .memo ("MockPgClient", () => nit.require ("postgresql.mocks.PgClient"))
    .memo ("TimestampUpdater", () => nit.require ("postgresql.triggers.TimestampUpdater"))
    .memo ("http", () => nit.require ("http"))

    .method ("useModels", function (...models)
    {
        this.models = models;

        return this;
    })
    .method ("useMockPgClient", function ()
    {
        return this
            .up (async (s) =>
            {
                s.MockPgClient.init ();

                s.db = new s.postgresql.Database;

                nit.require ("postgresql.registries.Cached").clearCache ();

                await s.db.connect ();
            })
            .before (({ self, models, db }) =>
            {
                models.forEach (name =>
                {
                    let model = db.lookup (name);

                    self[model.simpleName] = model;
                });
            })
            .deinit (s => s.MockPgClient.deinit ())
            .deinit (s => s.db = null)
            .snapshot ()
        ;
    })
    .method ("useMockDatabase", function (...args)
    {
        const Database = nit.require ("postgresql.mocks.Database");

        let db;

        return this
            .init (async (s) =>
            {
                if (db)
                {
                    await db.rollback ();
                }

                s.db = db = db || new Database (...args);
            })
            .up (async () =>
            {
                await db.begin ();
                await db.query ("SET CONSTRAINTS ALL DEFERRED");

                db.registry.models = {};
            })
            .before (async ({ self, models, db }) =>
            {
                if (models.length)
                {
                    (await db.createTables (...models))
                        .forEach (m => self[m.simpleName] = m)
                    ;
                }

                models.forEach (name =>
                {
                    let model = db.lookup (name);

                    self[model.simpleName] = model;
                });
            })
            .down (async ({ db, error }) =>
            {
                if (!error && db.client)
                {
                    db?.query ("SET CONSTRAINTS ALL IMMEDIATE");
                }
            })
            .deinit (s => s.db.save ())
            .snapshot ()
        ;
    })

    .method ("defineModel", function (name, builder)
    {
        return this
            .up (({ self, postgresql }) =>
            {
                let model = postgresql.defineModel (name);

                builder?.call (self, model);

                self.models.push (name);

                nit.require ("postgresql.registries.Cached").clearCache (name);
            })
        ;
    })
    .method ("registerDbProvider", function (property)
    {
        return this.before (s => s[property || "context"].serviceproviders.push (s.db));
    })
    .method ("expectingFieldEagerQueryToBe", function (dotPath, query)
    {
        const self = this;
        const [model, field] = nit.kvSplit (dotPath, ".");

        self.expecting (`the field eager query for ${dotPath} to be %{value|format}`,
            query,
            function (s)
            {
                return nit.get (s, `${model}.fieldMap.${field}.relationshipPath`).toQuery ().sql;
            }
        );

        self.expectors[self.expectors.length - 1].validator.sourceLine = self.constructor.getSourceLine (__filename);

        return self;
    })
    .method ("expectingModelEagerQueryToBe", function (model, query)
    {
        const self = this;

        self.expecting (`the model eager query for ${model} to be %{value|format}`,
            query,
            function (s)
            {
                return nit.get (s, `${model}.relationshipPath`).toQuery ().sql;
            }
        );

        self.expectors[self.expectors.length - 1].validator.sourceLine = self.constructor.getSourceLine (__filename);

        return self;
    })
;
