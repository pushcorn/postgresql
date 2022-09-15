module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineModel ("postgresql.Model"))
        .m ("error.entity_not_found", "No matched entity was found. (Matches: %{matches})")
        .categorize ()
        .staticMemo ("table", function ()
        {
            return nit.new ("postgresql.Table", this.simpleName);
        })
        .staticProperty ("db", "postgresql.Database", function ()
        {
            return nit.new ("postgresql.Database");
        })
        .defineValidationContext (ValidationContext =>
        {
            ValidationContext
                .property ("db", "postgresql.Database",
                {
                    getter: function (db)
                    {
                        return db || nit.get (this, "owner.constructor.db") || Self.db;
                    }
                })
            ;
        })
        .defineInnerClass ("Field", "nit.Model.Field", Field =>
        {
            Field
                .property ("column", "string",
                {
                    getter: function (v)
                    {
                        return v || this.name;
                    }
                })
                .property ("key", "boolean")
                .property ("transient", "boolean")
            ;
        })
        .staticMethod ("getKeyFields", function ()
        {
            return this.getProperties ().filter (f => f.key);
        })
        .staticMethod ("get", async function (...values)
        {
            let cls = this;
            let matches = nit.arrayCombine (cls.getKeyFields ().map (f => f.name), values);

            return await cls.find (matches);
        })
        .staticMethod ("find", async function (matches, otherClauses)
        {
            return (await this.select (matches, otherClauses))[0];
        })
        .staticMethod ("select", async function (matches, otherClauses)
        {
            let cls = this;
            let dbMatches = {};
            let model = new cls;
            let fields = nit.index (cls.getProperties (), "name");

            cls.update (model, () =>
            {
                nit.each (matches, function (v, k)
                {
                    if (k in fields)
                    {
                        let f = fields[k];

                        model[f.name] = v;
                        dbMatches[f.column] = model[f.name];
                    }
                });
            });

            return (await cls.db.select (cls.table.name, dbMatches, otherClauses))
                .map (r => cls.unmarshall (r))
            ;
        })
        .staticMethod ("load", async function (model) // load model by key(s)
        {
            let cls = this;
            let matches = {};

            model = model instanceof cls ? model : cls.create (model);

            cls.getKeyFields ().forEach (f =>
            {
                matches[f.name] = model[f.name];
            });

            let dbModel = await cls.find (matches);

            if (dbModel)
            {
                cls.update (model, dbModel.toPojo ());

                return model;
            }
            else
            {
                this.throw ("error.entity_not_found", { matches });
            }
        })
        .staticMethod ("save", async function (model)
        {
            let cls = this;

            model = model instanceof cls ? model : cls.create (model);

            await cls.validate (model);

            let data = cls.marshall (model);
            let matches = {};

            cls.getKeyFields ().forEach (f =>
            {
                nit.set (matches, f.column, model[f.name]);
            });

            await cls.db.upsert (cls.table.name, data, matches);

            return model;
        })
        .staticMethod ("unmarshall", function (row)
        {
            let cls = this;
            let model = new cls;
            let plugin = "transforms";

            return cls.update (model, () =>
            {
                cls.applyPlugins (plugin, "preUnmarshall", model, row);

                cls.getProperties ().forEach (f =>
                {
                    if (!f.transient)
                    {
                        model[f.name] = nit.get (row, f.column);
                    }
                });

                cls.applyPlugins (plugin, "postUnmarshall", model, row);
            });
        })
        .staticMethod ("marshall", function (model)
        {
            let row = {};
            let cls = this;
            let plugin = "transforms";

            cls.update (model, () =>
            {
                cls.applyPlugins (plugin, "preMarshall", model, row);

                cls.getProperties ().forEach (f =>
                {
                    if (!f.transient)
                    {
                        nit.set (row, f.column, model[f.name]);
                    }
                });

                cls.applyPlugins (plugin, "postMarshall", model, row);
            });

            return row;
        })
    ;
};
