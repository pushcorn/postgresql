test.command ("postgresql:delete")
    .useMockPgClient ()
        .snapshot ()

    .should ("delete the selected rows")
        .given ("users", { matches: { "": "age < 10" } })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE age < 10
        `)
        .commit ()

    .should ("delete the matching row for the specified model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { matches: { id: 10 } })
        .registerDbProvider ()
        .before (s => s.db.client.result = { rows: [{ id: 10, name: "John Doe" }] })
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "test_users"
            WHERE "id" = '10'
            LIMIT 1
            --
            DELETE FROM "test_users"
            WHERE "id" = '10'
        `)
        .commit ()
;
