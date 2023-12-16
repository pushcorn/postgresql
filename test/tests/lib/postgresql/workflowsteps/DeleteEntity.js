test.workflowStep ("postgresql:delete-entity")
    .useMockPgClient ()
    .should ("delete the model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .up (s => s.args = s.db.lookup ("test.models.User").new ({ id: 10, name: "John Doe" }))
        .before (s => s.db.client.result = { rows: [{ id: 10, name: "John Doe" }] })
        .registerDbService ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "test_users"
            WHERE "id" = '10'
            LIMIT 1
            --
            DELETE FROM "test_users"
            WHERE "id" = '10'
        `)
        .commit ()
;
