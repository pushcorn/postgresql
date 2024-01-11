test.command ("postgresql:select")
    .useMockPgClient ()
        .snapshot ()

    .should ("find the rows that match the criteria")
        .given ("users", { otherClauses: "WHERE age > 10" })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE age > 10
        `)
        .commit ()

    .should ("select the models")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { matches: { name: "John Doe" } })
        .registerDbProvider ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "test_users"
            WHERE "name" = 'John Doe'
        `)
        .commit ()
;
