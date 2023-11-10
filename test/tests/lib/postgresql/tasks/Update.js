test.task ("postgresql.tasks.Update")
    .useMockPgClient ()
    .should ("update the rows that match the specified criteria")
        .given ("users",
        {
            values:
            {
                disabled: true
            }
            ,
            matches:
            {
                "": "age > 10"
            }
        })
        .mock ("object", "getDb", function () { return this.strategy.db; })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            UPDATE "users"
            SET "disabled" = 'true'
            WHERE age > 10
        `)
        .commit ()
;
