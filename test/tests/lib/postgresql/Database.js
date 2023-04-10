const postgresql = nit.require ("postgresql");

const MockPgClient = nit
    .require ("postgresql.MockPgClient")
    .require ("postgresql.MockPgPool")
;

const { Tasks } = MockPgClient;



test.method ("postgresql.Database", "select")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("select the rows from the database")
        .given ("users", { id: 1 })
        .before (Tasks.returnResult ({ rows: [{ id: 1, user: "john" }] }))
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()

    .should ("return all rows if no condition was specified")
        .given ("users")
        .before (Tasks.returnResult ({ rows: [{ id: 1, user: "john" }] }))
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
        `)
        .commit ()
;


test.method ("postgresql.Database", "find")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("return first the row that matches the criteria")
        .given ("users", { id: 1 })
        .before (Tasks.returnResult ({ rows: [{ id: 1, user: "john" }] }))
        .returns ({ id: 1, user: "john" })
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "update")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("execute the update statement")
        .given ("users", { name: "John" }, { id: 1 })
        .before (Tasks.returnResult ({ rowCount: 1 }))
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            UPDATE "users"
            SET "name" = 'John'
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "insert")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("execute the insert statement")
        .given ("users", { name: "John", id: 1 })
        .before (Tasks.returnResult ({ rowCount: 1 }))
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            INSERT INTO "users" ("name", "id")
            VALUES ('John', '1')
        `)
        .commit ()
;


test.method ("postgresql.Database", "upsert")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("perform an upsert")
        .given ("users", { name: "John"}, { id: 1 })
        .before (Tasks.returnResult ({ rowCount: 1 }))
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            INSERT INTO "users" ("name", "id")
            VALUES ('John', '1')
            ON CONFLICT ("id")
            DO UPDATE
            SET "name" = 'John'
        `)
        .commit ()
;


test.method ("postgresql.Database", "delete")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("perform the deletion")
        .given ("users", { id: 1 })
        .before (Tasks.returnResult ({ rowCount: 1 }))
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()

    .given ("users")
        .before (Tasks.returnResult ({ rowCount: 3 }))
        .returns (3)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            DELETE FROM "users"
        `)
        .commit ()
;


test.method ("postgresql.Database", "query")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("format and execute a statement")
        .given ("SELECT * FROM users WHERE id = &1", 100)
        .before (Tasks.returnResult ({ rows: [] }))
        .returns ({ rows: [] })
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT * FROM users WHERE id = '100'
        `)
        .commit ()
;


test.method ("postgresql.Database", "fetch")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("return the rows for the given statement")
        .given ("SELECT * FROM users WHERE enabled = &1", true)
        .before (Tasks.returnResult ({ rows:
        [
            { id: 1, name: "John", enabled: true },
            { id: 2, name: "Jane", enabled: true }
        ]}))
        .returns (
        [
            { id: 1, name: "John", enabled: true },
            { id: 2, name: "Jane", enabled: true }
        ])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT * FROM users WHERE enabled = 'true'
        `)
        .commit ()
;


test.method ("postgresql.Database", "begin")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("start a transaction")
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.length", 1)
        .commit ()

    .should ("not start a new transaction if one exists")
        .after (async function ()
        {
            await this.object.begin ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.Database", "commit")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("not commit if no transaction was started")
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "")
        .expectingPropertyToBe ("object.client.query.invocations.length", 0)
        .commit ()

    .should ("commit if a transaction was started")
        .before (async function ()
        {
            await this.object.begin ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "COMMIT")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()

    .should ("commit only once if called multiple times")
        .before (async function ()
        {
            await this.object.begin ();
        })
        .after (async function ()
        {
            await this.object.commit ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "COMMIT")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()
;


test.method ("postgresql.Database", "rollback")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("not rollback if no transaction was started")
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "")
        .expectingPropertyToBe ("object.client.query.invocations.length", 0)
        .commit ()

    .should ("rollback if a transaction was started")
        .before (async function ()
        {
            await this.object.begin ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "ROLLBACK")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()

    .should ("rollback only once if called multiple times")
        .before (async function ()
        {
            await this.object.begin ();
        })
        .after (async function ()
        {
            await this.object.rollback ();
            await this.object.rollback ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "ROLLBACK")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()
;


test.method ("postgresql.Database", "transact")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("run tasks in a transaction")
        .given (function ()
        {
            return 100;
        })
        .returns (100)
        .expectingPropertyToBe ("object.client.query.invocations.0.args.0", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.1.args.0", "COMMIT")
        .commit ()

    .should ("rollback if the task throws")
        .given (function ()
        {
            throw new Error ("Unexpected!");
        })
        .throws ("Unexpected!")
        .expectingPropertyToBe ("object.client.query.invocations.0.args.0", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.1.args.0", "ROLLBACK")
        .commit ()
;


test.method ("postgresql.Database", "execute")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("execute the given statement")
        .given ("SELECT COUNT (*) FROM users")
        .mock ("object.client", "query", function ()
        {
            return 3;
        })
        .returns (3)
        .commit ()

    .should ("throw if the the statement caused an error")
        .given ("SELECT that!")
        .mock ("object.client", "query", function ()
        {
            throw new Error ("Invalid syntax!");
        })
        .throws ("error.query_failed")
        .expectingPropertyToBe ("error.message", "Invalid syntax!")
        .commit ()
;


test.method ("postgresql.Database", "connect")
    .before (function ()
    {
        MockPgClient.reset ();
    })
    .snapshot ()

    .should ("set up the client")
        .returnsInstanceOf (postgresql.Database)
        .commit ()

    .should ("only create the client if not connected")
        .before (async function ()
        {
            await this.object.connect ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.connect.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.Database", "connect", { createArgs: [{ pooling: true }] })
    .should ("return the pooled client if pooling is enabled")
        .returnsInstanceOf ("postgresql.Database")
        .expectingPropertyToBeOfType ("object.client", "postgresql.MockPgPool.Client")
        .commit ()
;


test.method ("postgresql.Database", "disconnect")
    .before (function ()
    {
        MockPgClient.reset ();
    })
    .snapshot ()

    .should ("disconnect and release the client")
        .before (async function ()
        {
            await this.object.connect ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client", undefined)
        .commit ()

    .should ("only disconnect the client only if connected")
        .before (async function ()
        {
            await this.object.connect ();
        })
        .after (async function ()
        {
            await this.object.disconnect ();
        })
        .returnsInstanceOf (postgresql.Database)
        .commit ()

    .should ("rollback the current transaction before disconnect")
        .mock ("object", "rollback")
        .before (async function ()
        {
            await this.object.begin ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.Database", "disconnect", { createArgs: [{ pooling: true }] })
    .should ("issue DISCARD ALL before releasing the client to the pool")
        .mock ("object.client", "query")
        .before (async function ()
        {
            await this.object.connect ();
        })
        .returnsInstanceOf ("postgresql.Database")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "DISCARD ALL")
        .commit ()
;


test.method ("postgresql.Database", "model")
    .should ("return a subclass of the given model and set its db property to the current database")
        .before (function ()
        {
            this.UserModel = nit.defineClass ("test.models.User", "postgresql.Model");
        })
        .given ("test:user")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "test.models.User")
        .expecting ("the returned model is a subclass of the given model", true, function (strategy)
        {
            return nit.is.subclassOf (strategy.result, strategy.UserModel);
        })
        .expecting ("the returned model is a local one", false, function (strategy)
        {
            return strategy.result == strategy.UserModel;
        })
        .expecting ("the model's db is set to the current database", true, function (strategy)
        {
            return strategy.object == strategy.result.db;
        })
        .commit ()
;
