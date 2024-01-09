test.command ("postgresql:select")
    .should ("find the rows that match the criteria")
        .useMockPgClient ()
        .given ("users", { otherClauses: "WHERE age > 10" })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE age > 10
        `)
        .commit ()
;
