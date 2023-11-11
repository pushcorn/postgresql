test.workflowStep ("postgresql:get")
    .useMockPgClient ()
    .should ("get the model by key(s)")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", 10)
        .mockGetDb ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '10'
            LIMIT 1
        `)
        .commit ()
;
