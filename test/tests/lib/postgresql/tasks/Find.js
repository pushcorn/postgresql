test.task ("postgresql.tasks.Find")
    .useMockPgClient ()
    .should ("find the row that matches the criteria")
        .given ("users", { matches: { id: 3 } })
        .registerDbService ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '3'
            LIMIT 1
        `)
        .commit ()
;
