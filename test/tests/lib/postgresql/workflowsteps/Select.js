test.workflowStep ("postgresql:select")
    .useMockPgClient ()
    .should ("select the models")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { matches: { name: "John Doe" } })
        .mockGetDb ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "name" = 'John Doe'
        `)
        .commit ()
;
