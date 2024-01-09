test.command ("postgresql:fetch-all")
    .should ("fetch all rows")
        .useMockPgClient ()
        .given ("select * from users where age < &1", 20)
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            select * from users where age < '20'
        `)
        .commit ()
;
