test.command ("postgresql:get")
    .should ("get the model by key(s)")
        .useMockPgClient ()
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", 10)
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "test_users"
            WHERE "id" = '10'
            LIMIT 1
        `)
        .commit ()
;
