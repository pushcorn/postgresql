test.method ("postgresql.Api", "dispatch")
    .should ("register the database provider")
        .up (s => s.class = s.class.defineSubclass ("MyApi")
            .onDispatch (ctx =>
            {
                s.db = ctx.db;
            })
        )
        .mock ("postgresql.Database.prototype", "disconnect")
        .before (s => s.args = s.http.Context.new ())
        .after (s => s.args[0].destroy ())
        .expectingPropertyToBeOfType ("db", "postgresql.Database")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;
