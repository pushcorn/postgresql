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
        .registerDbService ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '10'
            LIMIT 1
            --
            INSERT INTO "users" ("id", "name")
            VALUES ('10', 'John Doe')
        `)
        .commit ()
;
