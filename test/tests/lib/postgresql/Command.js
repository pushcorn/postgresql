nit.require ("postgresql.MockPgClient");

const Command = nit.require ("postgresql.Command");
const Context = Command.Context;

test.function (Context)
    .should ("provide a database connection")
    .expectingPropertyToBeOfType ("result.db", "postgresql.Database")
    .expectingPropertyToBeOfType ("result.db.client", "postgresql.MockPgClient")
    .commit ()

    .should ("not create a database connection if one is provided")
    .given ({ db: nit.new ("postgresql.Database") })
    .expectingPropertyToBeOfType ("result.db", "postgresql.Database")
    .expectingPropertyToBe ("result.db.client", undefined)
    .commit ()
;


test.method ("postgresql.Command", "finally")
    .should ("disconnect the database")
    .given (new Context ({ db: nit.new ("postgresql.Database") }))
    .expectingPropertyToBeOfType ("args.0.db", "postgresql.Database")
    .expectingPropertyToBe ("args.0.db.client", undefined)
    .commit ()
;
