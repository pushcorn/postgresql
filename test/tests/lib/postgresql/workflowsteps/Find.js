test.workflowStep ("postgresql:find")
    .useMockPgClient ()
    .should ("find the model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { matches: { name: "John Doe" } })
        .registerDbService ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "name" = 'John Doe'
            LIMIT 1
        `)
        .commit ()
;
