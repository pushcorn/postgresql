test.method ("postgresql.registries.Cached", "lookup")
    .useMockPgClient ()

    .should ("return create a new model if not cached")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "string", { key: true })
            ;
        })
        .given ("test.models.User")
        .returnsInstanceOf ("function")
        .commit ()

    .should ("return the cached model if exists")
        .before (s => s.object.lookup ("test.models.User"))
        .given ("test.models.User")
        .returnsInstanceOf ("function")
        .commit ()
;


test.method ("postgresql.registries.Cached", "clearCache", true)
    .should ("clear the cached models")
    .expectingPropertyToBe ("class.cache.models", {})
    .commit ()
;
