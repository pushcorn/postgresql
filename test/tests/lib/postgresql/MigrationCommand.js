const MockPgClient = nit.require ("postgresql.mocks.PgClient").init ();


test.object ("postgresql.MigrationCommand.Context")
    .should ("include the current migration state")
        .up (function ()
        {
            MockPgClient
                .method ("query", function ()
                {
                    return { rows: [{ name: "a.js" }, { name: "b.js" }] };
                })
            ;
        })
        .after (s => s.instance.registerService (nit.new ("postgresql.Database")))
        .mock ("postgresql.Migration.table", "exists", true)
        .expectingMethodToReturnValue ("result.getMigratedScripts", null, ["a.js", "b.js"])
        .commit ()

    .reset ()
        .up (function ()
        {
            MockPgClient
                .method ("query", function ()
                {
                    return { rows: [{ name: "a.js" }] };
                })
            ;
        })
        .mock ("postgresql.Migration.table", "exists", false)
        .mock ("postgresql.Migration.table", "create")
        .after (s => s.instance.registerService (nit.new ("postgresql.Database")))
        .after (function ()
        {
            this.result.input.dir.read = function ()
            {
                return ["a.js", "b.js"];
            };
        })
        .expectingMethodToReturnValue ("result.getUnmigratedScripts", null, ["b.js"])
        .commit ()
;


test.method ("postgresql.MigrationCommand", "run")
    .should ("ensure the migration table exists before running the command")
        .up (s => s.class = s.class.defineSubclass ("MyCommand")
            .onRun (() => s.runCalled = true)
        )
        .mock ("postgresql.Table.prototype", "exists", true)
        .expectingPropertyToBe ("runCalled", true)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;
