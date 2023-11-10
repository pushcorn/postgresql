const postgresql = nit.require ("postgresql");

const MockPgClient = nit
    .require ("postgresql.mocks.PgClient")
    .require ("postgresql.mocks.PgPool")
;

const { Tasks } = MockPgClient;



test.method ("postgresql.Database", "select")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("select the rows from the database")
        .given ("users", { id: 1 }, "LIMIT 1")
        .before (Tasks.returnResult ({ rows: [{ id: 1, user: "john" }] }))
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
            LIMIT 1
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

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Select")
                .$from ("users")
                .$where ("id", 1)
        )
        .before (Tasks.returnResult ({ rows: [{ id: 1, user: "john" }] }))
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
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
            LIMIT 1
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

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Update")
                .$table ("users")
                .$set ("name", "John")
                .$where ("id", 1)
        )
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

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Insert")
                .$table ("users")
                .$value ("name", "John")
                .$value ("id", 1)
        )
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
              SET "name" = EXCLUDED."name"
        `)
        .commit ()

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Insert")
                .$table ("users")
                .$value ("name", "John")
                .$conflictBy ("id", 1)
        )
        .before (Tasks.returnResult ({ rowCount: 1 }))
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            INSERT INTO "users" ("name", "id")
            VALUES ('John', '1')
            ON CONFLICT ("id")
            DO UPDATE
              SET "name" = EXCLUDED."name"
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

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Delete")
                .$table ("users")
                .$where ("id", 1)
        )
        .before (Tasks.returnResult ({ rowCount: 1 }))
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE "id" = '1'
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

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Select")
                .$from ("users")
                .$where ("id", 1)
        )
        .before (Tasks.returnResult ({ rows: [] }))
        .returns ({ rows: [] })
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "fetchAll")
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


test.method ("postgresql.Database", "fetch")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("return a single row for the given statement")
        .given ("SELECT * FROM users WHERE enabled = &1", true)
        .before (Tasks.returnResult ({ rows:
        [
            { id: 1, name: "John", enabled: true },
            { id: 2, name: "Jane", enabled: true }
        ]}))
        .returns ({ id: 1, name: "John", enabled: true })
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT * FROM users WHERE enabled = 'true'
        `)
        .commit ()
;


test.method ("postgresql.Database", "value")
    .before (Tasks.createClient)
    .snapshot ()

    .should ("return the value for the first column of the first row")
        .given ("SELECT name FROM users WHERE enabled = &1", true)
        .before (Tasks.returnResult ({ rows: [{ name: "John" }]}))
        .returns ("John")
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
        .throws ("error.database_error")
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
        .throws ("error.database_error")
        .expectingPropertyToBe ("error.message", "Database error: Invalid syntax!")
        .commit ()

    .should ("parse the value of an array column")
        .given ("SELECT * FROM users")
        .mock ("object.client", "query", function ()
        {
            return {
                rows: [{ username: "johndoe", aliases: [JSON.stringify ({ n: "jd1" }), JSON.stringify ({ n: "jd2" })] }]
            };
        })
        .returns ({
            rows: [{ username: "johndoe", aliases: [{ n: "jd1" }, { n: "jd2" }] }]
        })
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
        .expectingPropertyToBeOfType ("object.client", "postgresql.mocks.PgPool.Client")
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


test.method ("postgresql.Database.Registry", "lookup")
    .should ("return the model class from the cached registry")
        .up (s => s.createArgs = new postgresql.Database)
        .before (() =>
        {
            postgresql.defineModel ("test.models.Country")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .given ("test.models.Country")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.name", "test.models.Country")
        .expectingPropertyToBeOfType ("result.db", "postgresql.Database")
        .commit ()
;


test.object (postgresql.Database)
    .should ("have a shared property that provides a global database instance")
        .expectingPropertyToBeOfType ("result.shared", "postgresql.Database")
        .commit ()
;


test.method ("postgresql.Database", "info")
    .should ("log the info message to the console")
        .given ("This is a test.")
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args", /\[INFO].*this is a test/i)
        .commit ()
;


test.method ("postgresql.Database", "debug")
    .should ("log the debug message to the console")
        .given ("This is a debug message.")
        .before (s =>
        {
            s.patterns = nit.debug.PATTERNS.slice ();

            nit.debug ("postgresql.Database");
        })
        .after (s => nit.debug.PATTERNS = s.patterns)
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args", /\[DEBUG].*\(postgresql.Database.*\).*this is a debug/i)
        .expectingPropertyToBe ("object.logColor", /^[a-z]+$/)
        .commit ()
;


test.method ("postgresql.Database", "createTables")
    .should ("create tables for the given model classes")
        .before (s =>
        {
            postgresql.defineModel ("test.models.Person")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("followers...", "test.models.Person")
            ;

            postgresql.defineModel ("test.models.Country")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;

            postgresql.defineModel ("test.models.Capital")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("<country>", "test.models.Country")
                .field ("mayor", "test.models.Person")
            ;

            s.args.push (nit.lookupClass ("test.models.Country"));
        })
        .given ("test.models.Capital")
        .spy ("object", "execute")
        .expectingPropertyToBe ("spies.0.invocations.0.args.0", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "countries"
            (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("id"),
                UNIQUE ("name")
            )
        `)
        .expectingPropertyToBe ("spies.0.invocations.1.args.0", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "capitals"
            (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "country_id" TEXT NOT NULL,
                "mayor_id" TEXT,
                PRIMARY KEY ("id"),
                UNIQUE ("name")
            )
        `)
        .expectingPropertyToBe ("spies.0.invocations.2.args.0", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "people"
            (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("id")
            )
        `)
        .expectingPropertyToBe ("spies.0.invocations.3.args.0", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "personFollowersPersonPeopleLinks"
            (
                "person_id" TEXT NOT NULL,
                "follower_id" TEXT NOT NULL,
                PRIMARY KEY ("person_id", "follower_id")
            )
        `)
        .expectingPropertyToBe ("spies.0.invocations.4.args.0", nit.trim.text`
            ALTER TABLE "capitals"
            ADD CONSTRAINT "capitals_country_id_fk" FOREIGN KEY ("country_id")
            REFERENCES "countries" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("spies.0.invocations.5.args.0", nit.trim.text`
            ALTER TABLE "capitals"
            ADD CONSTRAINT "capitals_country_id_uk" UNIQUE ("country_id")
        `)
        .expectingPropertyToBe ("spies.0.invocations.8.args.0", nit.trim.text`
            ALTER TABLE "personFollowersPersonPeopleLinks"
            ADD CONSTRAINT "personFollowersPersonPeopleLinks_person_id_fk" FOREIGN KEY ("person_id")
            REFERENCES "people" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("spies.0.invocations.9.args.0", nit.trim.text`
            ALTER TABLE "personFollowersPersonPeopleLinks"
            ADD CONSTRAINT "personFollowersPersonPeopleLinks_follower_id_fk" FOREIGN KEY ("follower_id")
            REFERENCES "people" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("spies.0.invocations.10.args.0", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_personFollowersPersonPeopleLinks_follower_id"
            ON "personFollowersPersonPeopleLinks" ("follower_id")
        `)
        .commit ()
;


test.method ("postgresql.Database", "dropTables")
    .should ("drop the tables owned by the specifed models")
        .before (s =>
        {
            postgresql.defineModel ("test.models.Person")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("followers...", "test.models.Person")
            ;

            postgresql.defineModel ("test.models.Country")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;

            postgresql.defineModel ("test.models.Capital")
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("<country>", "test.models.Country")
                .field ("mayor", "test.models.Person")
            ;

            s.args.push (nit.lookupClass ("test.models.Country"));
        })
        .given ("test.models.Capital")
        .spy ("object", "execute")
        .expectingPropertyToBe ("spies.0.invocations.0.args.0", nit.trim.text`
            DROP TABLE IF EXISTS "capitals" CASCADE
        `)
        .expectingPropertyToBe ("spies.0.invocations.1.args.0", nit.trim.text`
            DROP TABLE IF EXISTS "countries" CASCADE
        `)
        .commit ()
;
