test.task ("postgresql.tasks.Insert")
    .useMockPgClient ()
    .should ("insert a row")
        .given ("users", { values: { firstname: "John", lastname: "Doe" } })
        .mock ("object", "getDb", function () { return this.strategy.db; })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            INSERT INTO "users" ("firstname", "lastname")
            VALUES ('John', 'Doe')
        `)
        .commit ()
;
