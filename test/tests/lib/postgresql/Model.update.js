test.method ("postgresql.Model", "update")
    .useMockDatabase ()
    .should ("update an entity in the database")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
                .field ("[note]", "string")
            ;
        })
        .before (async (s) =>
        {
            s.options = new s.User.QueryOptions;
            s.object = s.User.new (123, "John Doe");
            s.args = s.options;

            await s.object.insert ();

            s.object.name = "Jane Doe";
        })
        .after (async (s) =>
        {
            s.user = await s.User.load (123);

            await s.user.update ({ name: "Jane Doe" });
        })
        .expectingMethodToReturnValue ("db.select", "test_users", [{ id: 123, name: "Jane Doe", note: "" }])
        .expecting ("the same entity will not be updated twice", true, async (s) => (await s.object.update (s.options)) instanceof s.User)
        .expecting ("the provided data object can be used to update the entity", true, async (s) => (await s.object.update ({ name: "John Doe" })) instanceof s.User)
        .expectingMethodToReturnValue ("db.select", "test_users", [{ id: 123, name: "John Doe", note: "" }])
        .expectingPropertyToBe ("user.name", "Jane Doe")
        .commit ()

    .should ("throw if the entity was not found in the database")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
                .field ("[note]", "string")
            ;
        })
        .before (async (s) =>
        {
            s.options = new s.User.QueryOptions;
            s.object = s.User.new (123, "John Doe");
            s.args = s.options;
        })
        .throws ("error.entity_not_found")
        .commit ()

    .should ("be able to update the related entities if cascade is true")
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

            await s.object.save (true);

            s.object.name = "Taipei";
            s.object.country.name = "Taiwan";
        })
        .expectingMethodToReturnValue ("db.select", "test_capitals", [{ id: 222, name: "Taipei", country_id: 1234 }])
        .expectingMethodToReturnValue ("db.select", "test_countries", [{ id: 1234, name: "Taiwan" }])
        .commit ()
;
