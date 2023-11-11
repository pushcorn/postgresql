test.workflowStep ("postgresql:create")
    .useMockPgClient ()
    .should ("insert the model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { data: { name: "John Doe" } })
        .mockGetDb ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            INSERT INTO "users" ("id", "name")
            VALUES ('0', 'John Doe')
        `)
        .commit ()
;
