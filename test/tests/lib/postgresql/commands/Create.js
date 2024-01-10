test.command ("postgresql:create")
    .should ("create an entity")
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
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            INSERT INTO "test_users" ("id", "name")
            VALUES ('0', 'John Doe')
        `)
        .commit ()
;
