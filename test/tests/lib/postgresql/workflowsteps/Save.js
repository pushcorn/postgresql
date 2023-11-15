test.workflowStep ("postgresql:save")
    .useMockPgClient ()
    .should ("save the model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { data: { name: "John Doe" } })
        .registerDbService ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '0'
            LIMIT 1
            --
            INSERT INTO "users" ("id", "name")
            VALUES ('0', 'John Doe')
        `)
        .commit ()
;
