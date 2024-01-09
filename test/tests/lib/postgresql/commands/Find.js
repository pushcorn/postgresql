test.command ("postgresql:find")
    .should ("find the row that matches the criteria")
        .useMockPgClient ()
        .given ("users", { matches: { id: 3 } })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '3'
            LIMIT 1
        `)
        .commit ()
;
