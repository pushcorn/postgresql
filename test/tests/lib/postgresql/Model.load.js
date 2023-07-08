test.method ("postgresql.Model", "load")
    .useMockDatabase ()
    .should ("load entity data from the database")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .before (async (s) =>
        {
            s.options = s.Capital.QueryOptions.cascade ();
            s.object = s.Capital.new (222, "Washington D.C.", s.Country.new (1234, "USA"));
            s.args = s.options;

            await s.object.insert (true);

            s.object = new s.Capital (222);
        })
        .returnsInstanceOf ("test.models.Capital")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: 222,
            name: "Washington D.C.",
            country:
            {
                id: 1234,
                name: "",
                capital: undefined
            }
        })
        .commit ()

    .should ("be able to load entity eagerly")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Capital.new (222, "Washington D.C.", s.Country.new (1234, "USA"));
            s.args = true;

            await s.object.insert (true);

            s.object = new s.Capital (222);
        })
        .returnsInstanceOf ("test.models.Capital")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: 222,
            name: "Washington D.C.",
            country:
            {
                id: 1234,
                name: "USA",
                capital: null
            }
        })
        .commit ()

    .should ("throw if the the entity is not found in the database")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
            ;
        })
        .before (async (s) =>
        {
            s.object = new s.Capital (222);
        })
        .throws ("error.entity_not_found")
        .commit ()
;
