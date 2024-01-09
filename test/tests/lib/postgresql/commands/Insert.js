test.command ("postgresql:insert")
    .should ("insert a row")
        .useMockPgClient ()
        .given ("users", { values: { firstname: "John", lastname: "Doe" } })
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            INSERT INTO "users" ("firstname", "lastname")
            VALUES ('John', 'Doe')
        `)
        .commit ()
;
