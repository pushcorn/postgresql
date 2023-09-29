nit.require ("postgresql.mocks.PgClient");

const Command = nit.require ("postgresql.Command");
const Context = Command.Context;


test.function (Context)
    .should ("provide a database connection")
        .expectingPropertyToBeOfType ("result.db", "postgresql.Database")
        .commit ()
;


test.method ("postgresql.Command", "finally")
    .should ("disconnect the database")
        .up (s => s.args = new Context)
        .up (s => s.args[0].db.connect ())
        .expectingPropertyToBeOfType ("args.0.db", "postgresql.Database")
        .expectingPropertyToBe ("args.0.db.client", undefined)
        .commit ()
;
