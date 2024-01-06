const Context = nit.require ("http.Context");


test.method ("postgresql.Api", "dispatch")
    .should ("register the database provider")
        .up (s => s.class = s.class.defineSubclass ("MyApi")
            .onDispatch (ctx =>
            {
                s.db = ctx.lookupService ("postgresql.Database");
            })
        )
        .mock ("postgresql.Database.prototype", "disconnect")
        .given (Context.new ())
        .after (s => s.args[0].destroy ())
        .expectingPropertyToBeOfType ("db", "postgresql.Database")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;
