test.command ("postgresql:fetch")
    .should ("fetch a row")
        .useMockPgClient ()
        .given ("select * from users where age < &1", 20)
        .registerDbProvider ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            select * from users where age < '20'
        `)
        .commit ()
;
