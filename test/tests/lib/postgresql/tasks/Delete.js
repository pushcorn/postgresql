test.task ("postgresql.tasks.Delete")
    .useMockPgClient ()
    .should ("delete the selected rows")
        .given ("users", { matches: { "": "age < 10" } })
        .mock ("object", "getDb", function () { return this.strategy.db; })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE age < 10
        `)
        .commit ()
;
