test.workflowStep ("postgresql:insert-entity")
    .useMockPgClient ()
    .should ("insert an entity")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .up (s => s.args = s.db.lookup ("test.models.User").new ({ id: 10, name: "John Doe" }))
        .registerDbProvider ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            INSERT INTO "test_users" ("id", "name")
            VALUES ('10', 'John Doe')
        `)
        .commit ()
;
