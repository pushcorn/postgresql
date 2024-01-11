test.command ("postgresql:save")
    .should ("save the model")
        .useMockPgClient ()
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { data: { name: "John Doe" } })
        .registerDbProvider ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "test_users"
            WHERE "id" = '0'
            LIMIT 1
            --
            INSERT INTO "test_users" ("id", "name")
            VALUES ('0', 'John Doe')
        `)
        .commit ()
;

