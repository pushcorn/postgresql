test.workflowStep ("postgresql:save-entity")
    .useMockPgClient ()
    .should ("save an entity")
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
            SELECT *
            FROM "test_users"
            WHERE "id" = '10'
            LIMIT 1
            --
            INSERT INTO "test_users" ("id", "name")
            VALUES ('10', 'John Doe')
        `)
        .commit ()
;
