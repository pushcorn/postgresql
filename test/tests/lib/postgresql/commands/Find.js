test.command ("postgresql:find")
    .useMockPgClient ()
        .snapshot ()

    .should ("find the row that matches the criteria")
        .given ("users", { matches: { id: 3 } })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '3'
            LIMIT 1
        `)
        .commit ()

    .should ("find the matching rows for the specified model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { matches: { name: "John Doe" } })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "test_users"
            WHERE "name" = 'John Doe'
            LIMIT 1
        `)
        .commit ()
;
