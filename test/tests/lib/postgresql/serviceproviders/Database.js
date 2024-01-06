test.method ("postgresql.serviceproviders.Database", "create")
    .should ("create an instance of the database")
        .up (s => s.createArgs = "testdb")
        .returnsInstanceOf ("postgresql.Database")
        .expectingPropertyToBe ("result.database", "testdb")
        .commit ()
;


test.method ("postgresql.serviceproviders.Database", "destroy")
    .should ("disconnect the database")
        .before (s => s.db = s.object.create ())
        .before (s => s.args = s.db)
        .mock ("db", "disconnect")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;
