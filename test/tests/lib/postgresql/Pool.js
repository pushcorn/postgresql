nit.require ("postgresql.mocks.PgPool");


test.method ("postgresql.Pool", "connect")
    .should ("create the pool and connect to the database")
    .returnsInstanceOf ("postgresql.mocks.PgPool.Client")
    .expectingPropertyToBeOfType ("object.pgPool", "postgresql.mocks.PgPool")
    .expectingPropertyToBe ("object.stats",
    {
        id: "",
        total: 1,
        waiting: 0,
        idle: 0,
        size: 0
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
    .expectingPropertyToBe ("object.pgPool._clients.length", 0)
    .commit ()
;


test.method ("postgresql.Pool", "get", true)
    .should ("return the pool instance with the specified ID")
        .given ("test")
        .returnsInstanceOf ("postgresql.Pool")
        .expectingPropertyToBe ("result.id", "test")
        .commit ()

    .should ("return the pool instance with ID 'main' if no ID was specified")
        .given ()
        .returnsInstanceOf ("postgresql.Pool")
        .expectingPropertyToBe ("result.id", "main")
        .commit ()
;
