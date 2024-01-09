test.command ("postgresql:delete")
    .should ("delete the selected rows")
        .useMockPgClient ()
        .given ("users", { matches: { "": "age < 10" } })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE age < 10
        `)
        .commit ()
;
