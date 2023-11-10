test.task ("postgresql.tasks.Find")
    .useMockPgClient ()
    .should ("find the row that matches the criteria")
        .given ("users", { matches: { id: 3 } })
        .mock ("object", "getDb", function () { return this.strategy.db; })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '3'
            LIMIT 1
        `)
        .commit ()
;
