test.task ("postgresql.tasks.Upsert")
    .useMockPgClient ()
    .should ("insert a row")
        .given ("users", { values: { firstname: "John", lastname: "Doe" }, matches: { id: 9 } })
        .mock ("object", "getDb", function () { return this.strategy.db; })
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            INSERT INTO "users" ("firstname", "lastname", "id")
            VALUES ('John', 'Doe', '9')
            ON CONFLICT ("id")
            DO UPDATE
              SET "firstname" = EXCLUDED."firstname", "lastname" = EXCLUDED."lastname"
        `)
        .commit ()
;
