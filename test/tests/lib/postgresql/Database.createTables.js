nit.require ("postgresql.mocks.Database"); // do not remove


test.method ("postgresql.Database", "createTables")
    .should ("create the tables for the current model")
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag")
            ;
        })
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("products...", "test.models.Product")
            ;
        })
        .before (async (s) =>
        {
            let db = s.db = nit.new ("postgresql.mocks.Database");

            s.models.forEach (name =>
            {
                let model = db.lookup (name);

                s[model.simpleName] = model;
            });

            s.object = s.db;
            s.args = s.Product;

            await db.begin ();
            await db.query ("SET CONSTRAINTS ALL DEFERRED");
        })
        .after (async (s) =>
        {
            let tableNames = [s.Product.tableName, s.Tag.tableName, s.Product.fieldMap.tags.relationship.joinModelClass.tableName];

            s.createdTables = [];
            s.droppedTables = [];

            for (let t of tableNames)
            {
                if (await s.db.value ("SELECT tablename FROM pg_tables WHERE tablename = &1", t))
                {
                    s.createdTables.push (t);
                }
            }

            await s.db.dropTables (s.Product, s.Tag);

            for (let t of tableNames)
            {
                if (!(await s.db.value ("SELECT tablename FROM pg_tables WHERE tablename = &1", t)))
                {
                    s.droppedTables.push (t);
                }
            }
        })
        .after (s => s.db.disconnect ())
        .expectingPropertyToBe ("createdTables", ["test_products", "test_tags", "test_productTagsTagProductsLinks"])
        .expectingPropertyToBe ("droppedTables", ["test_products", "test_tags", "test_productTagsTagProductsLinks"])
        .commit ()
;
