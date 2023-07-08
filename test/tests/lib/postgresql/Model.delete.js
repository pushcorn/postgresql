test.method ("postgresql.Model", "delete")
    .useMockDatabase ()
    .should ("delete an entity from the database")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .before (async (s) =>
        {
            s.options = new s.User.QueryOptions;
            s.object = s.User.new (123, "John Doe");
            s.args = s.options;

            await s.object.insert ();
        })
        .expectingPropertyToBe ("object.postgresql\\.Model\\.dbId", undefined)
        .expectingMethodToReturnValue ("db.select", "users", [])
        .expecting ("the same entity will not be deleted twice", true, async (s) => (await s.object.delete (s.options)) instanceof s.User)
        .commit ()

    .should ("skip if the entity was not saved before")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.User.new (123, "John Doe");
        })
        .expectingPropertyToBe ("object.postgresql\\.Model\\.dbId", undefined)
        .expectingMethodToReturnValue ("db.select", "users", [])
        .commit ()

    .should ("be able to delete the related entities if cascade is true")
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
        })
        .expectingMethodToReturnValue ("db.select", "capitals", [])
        .expectingMethodToReturnValue ("db.select", "countries", [])
        .commit ()
;
