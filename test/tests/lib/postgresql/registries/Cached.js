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

    .should ("return undefined if optional is true and the model does not exist")
        .given ("test.models.Group", true)
        .returns ()
        .commit ()
;


test.method ("postgresql.registries.Cached", "clearCache", true)
    .should ("clear the cache if model name was not specified")
        .expectingPropertyToBe ("class.cache.models", {})
        .commit ()

    .should ("clear the cached models")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "string", { key: true })
            ;
        })
        .before (s => s.class.cache.lookup ("test.models.User"))
        .given ("test.models.User")
        .commit ()

    .should ("not delete the unmatched models")
        .defineModel ("test.models.Group", Group =>
        {
            Group
                .field ("<id>", "string", { key: true })
            ;
        })
        .before (s => s.class.cache.lookup ("test.models.Group"))
        .before (s => s.class.cache.lookup ("test.models.User"))
        .given ("test.models.User")
        .commit ()
;
