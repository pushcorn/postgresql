test.method ("postgresql.Model", "insert")
    .useMockDatabase ()
    .should ("insert an entity into the database")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User.new (123, "John Doe");
        })
        .commit ()

    .should ("be able to insert the related entities if cascade is true")
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
        .before (s =>
        {
            s.options = s.Capital.QueryOptions.cascade ();
            s.object = s.Capital.new (222, "Washington D.C.", s.Country.new (1234, "USA"));
            s.args = s.options;
        })
        .expecting ("the same entity will not be inserted twice", true, async (s) => (await s.object.insert (s.options)) instanceof s.Capital)
        .commit ()
;
