test.workflowStep ("postgresql:update-entity")
    .useMockPgClient ()
    .should ("delete the model")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .up (s => s.args = [
            s.db.lookup ("test.models.User").new ({ id: 10, name: "John Doe" }),
            {
                data: { name: "Jane Doe" }
            }
        ])
        .before (s => s.db.client.result = { rows: [{ id: 10, name: "John Doe" }] })
        .mockGetDb ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '10'
            LIMIT 1
            --
            UPDATE "users"
            SET "name" = 'Jane Doe'
            WHERE "id" = '10'
        `)
        .commit ()
;
