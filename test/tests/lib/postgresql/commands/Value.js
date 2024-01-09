test.command ("postgresql:value")
    .should ("return the first column value of the selected row")
        .useMockPgClient ()
        .given ("select * from users where age < &1", 20)
        .up (s => s.db.client.result = ({ rows: [{ id: 10, age: 15 }] }))
        .registerDbProvider ()
        .returns (10)
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            select * from users where age < '20'
        `)
        .commit ()
;
