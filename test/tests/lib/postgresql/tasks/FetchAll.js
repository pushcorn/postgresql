test.task ("postgresql.tasks.FetchAll")
    .useMockPgClient ()
    .should ("fetch all rows")
        .given ("select * from users where age < &1", 20)
        .mock ("object", "getDb", function () { return this.strategy.db; })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            select * from users where age < '20'
        `)
        .commit ()
;
