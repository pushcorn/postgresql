nit.require ("postgresql.MockPgClient");


nit.defineCommand ("DbCommand")
    .plugin ("postgresql.commandplugins.DatabaseProvider")
    .run (function (ctx)
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
    .plugin ("postgresql.commandplugins.DatabaseProvider", "mydb", false)
    .run (function (ctx)
    {
        ctx.hasDb = !!ctx.mydb;
        ctx.lastStatement = ctx.mydb.client.statement;

        return ctx.hasDb;
    })
;

test.object ("postgresql.commandplugins.DatabaseProvider")
    .should ("be an instance of nit.Command.Plugin")
    .given ("mydb")
    .returnsInstanceOf (nit.Command.Plugin)
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
