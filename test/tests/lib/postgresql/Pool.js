nit.require ("postgresql.MockPgPool");


test.method ("postgresql.Pool", "connect")
    .should ("create the pool and connect to the database")
    .returnsInstanceOf ("postgresql.Database")
    .expectingPropertyToBeOfType ("object.pool", "postgresql.MockPgPool")
    .expectingPropertyToBeOfType ("result.client", "postgresql.MockPgPool.Client")
    .expectingPropertyToBe ("object.stats",
    {
        totalCount: 1,
        waitingCount: 0,
        idleCount: 0
    })
    .commit ()
;


test.method ("postgresql.Pool", "disconnect")
    .should ("release all clients and disconnect from the database")
    .before (function ()
    {
        return this.object.connect ();
    })
    .returnsInstanceOf ("postgresql.Pool")
    .expectingPropertyToBe ("object.pool._clients.length", 0)
    .commit ()
;
