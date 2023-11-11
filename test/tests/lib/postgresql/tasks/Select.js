test.task ("postgresql.tasks.Select")
    .useMockPgClient ()
    .should ("find the rows that match the criteria")
        .given ("users", { otherClauses: "WHERE age > 10" })
        .mockGetDb ()
        .expectingPropertyToBe ("db.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE age > 10
        `)
        .commit ()
;
