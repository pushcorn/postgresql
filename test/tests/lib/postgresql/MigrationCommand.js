const postgresql = nit.require ("postgresql");
const MockPgClient = nit.require ("postgresql.MockPgClient");

nit.require ("postgresql.MigrationCommand");


test.object ("postgresql.MigrationCommand.Context")
    .should ("include the current migration state")
        .given ({ db: nit.new ("postgresql.Database") })
        .up (function ()
        {
            MockPgClient
                .method ("query", function ()
                {
                    return { rows: [{ name: "a.js" }, { name: "b.js" }] };
                })
            ;
        })
        .mock (postgresql.Migration.table, "exists", true)
        .expectingMethodToReturnValue ("result.getMigratedScripts", ["a.js", "b.js"])
        .commit ()

    .given ({ db: nit.new ("postgresql.Database") })
        .up (function ()
        {
            MockPgClient
                .method ("query", function ()
                {
                    return { rows: [{ name: "a.js" }] };
                })
            ;
        })
        .mock (postgresql.Migration.table, "exists", false)
        .mock (postgresql.Migration.table, "create")
        .after (function ()
        {
            this.result.input.dir.read = function ()
            {
                return ["a.js", "b.js"];
            };
        })
        .expectingMethodToReturnValue ("result.getUnmigratedScripts", ["b.js"])
        .commit ()
;
