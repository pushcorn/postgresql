test.task ("postgresql.tasks.Fetch")
    .useMockPgClient ()
    .should ("fetch a row")
        .given ("select * from users where age < &1", 20)
        .mockGetDb ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            select * from users where age < '20'
        `)
        .commit ()
;
