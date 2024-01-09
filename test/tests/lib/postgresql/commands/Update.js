test.command ("postgresql:update")
    .should ("update the rows that match the specified criteria")
        .useMockPgClient ()
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
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            UPDATE "users"
            SET "disabled" = 'true'
            WHERE age > 10
        `)
        .commit ()
;
