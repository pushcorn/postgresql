test.object ("postgresql.Command.Context", true, "db")
    .should ("provide a default db instance")
        .before (s => s.instance.command = nit.new ("postgresql.Command"))
        .returnsInstanceOf ("postgresql.Database")
        .commit ()

    .should ("return the existing db instance")
        .before (s => s.instance.command = nit.new ("postgresql.Command"))
        .before (s => s.instance.registerService (nit.new ("postgresql.Database")))
        .returnsInstanceOf ("postgresql.Database")
        .commit ()
;


test.method ("postgresql.Command", "finally")
    .should ("disconnect the created database")
        .before (s => s.context = s.class.Context.new ({ command: s.object }))
        .before (s => s.context.db)
        .before (s => s.args = s.context)
        .mock ("postgresql.Database.prototype", "disconnect")
        .expectingPropertyToBeOfType ("args.0.db", "postgresql.Database")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;
