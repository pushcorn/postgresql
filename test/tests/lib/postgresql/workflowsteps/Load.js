test.workflowStep ("postgresql:load")
    .useMockPgClient ()
    .should ("load the model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { matches: { name: "John Doe" } })
        .mockGetDb ()
        .before (s => s.db.client.result = { rows: [{ id: 3, name: "John Doe" }] })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "name" = 'John Doe'
            LIMIT 1
        `)
        .commit ()
;
