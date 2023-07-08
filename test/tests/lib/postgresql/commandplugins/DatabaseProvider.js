nit.require ("postgresql.mocks.PgClient");


nit.defineCommand ("DbCommand")
    .commandplugin ("postgresql:database-provider")
    .onRun (function (ctx)
    {
        ctx.hasDb = !!ctx.db;
        ctx.lastStatement = ctx.db.client.statement;
        ctx.db.commit = function ()
        {
            ctx.committed = true;
        };

        return ctx.hasDb;
    })
;


nit.defineCommand ("DbNoTxCommand")
    .commandplugin ("postgresql:database-provider", "mydb", false)
    .onRun (function (ctx)
    {
        ctx.hasDb = !!ctx.mydb;
        ctx.lastStatement = ctx.mydb.client.statement;

        return ctx.hasDb;
    })
;


test.object ("postgresql.commandplugins.DatabaseProvider")
    .should ("be an instance of nit.Command.CommandPlugin")
    .given ("mydb")
    .returnsInstanceOf (nit.Command.CommandPlugin)
    .expectingPropertyToBe ("result.property", "mydb")
    .commit ()
;


test.command ("DbCommand")
    .should ("have the db connection ready before running")
    .returns (true)
    .expectingPropertyToBe ("context.lastStatement", "BEGIN")
    .expectingPropertyToBe ("context.committed", true)
    .commit ()
;


test.command ("DbNoTxCommand")
    .should ("have the db connection ready before running")
    .returns (true)
    .expectingPropertyToBe ("context.lastStatement", "")
    .commit ()
;
