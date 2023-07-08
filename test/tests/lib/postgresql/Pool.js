nit.require ("postgresql.mocks.PgPool");


test.method ("postgresql.Pool", "connect")
    .should ("create the pool and connect to the database")
    .returnsInstanceOf ("postgresql.mocks.PgPool.Client")
    .expectingPropertyToBeOfType ("object.pool", "postgresql.mocks.PgPool")
    .expectingPropertyToBe ("object.stats",
    {
        totalCount: 1,
        waitingCount: 0,
        idleCount: 0
    })
    .commit ()
;


test.method ("postgresql.Pool", "end")
    .should ("release all clients and disconnect from the database")
    .before (async function ()
    {
        await this.object.connect ();
    })
    .returnsInstanceOf ("postgresql.Pool")
    .expectingPropertyToBe ("object.pool._clients.length", 0)
    .commit ()
;
