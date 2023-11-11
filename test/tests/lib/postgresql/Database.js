const postgresql = nit.require ("postgresql");
const MockPgClient = nit
    .require ("postgresql.mocks.PgClient")
    .require ("postgresql.mocks.PgPool")
;


nit.test.Strategy
    .method ("mockClient", function (result)
    {
        return this
            .up (s => s.client = new MockPgClient ({ result }))
            .up (() => MockPgClient.reset ())
            .mock ("object", "connect", function ()
            {
                let { target, strategy } = this;

                target.client = strategy.client;

                return target;
            })
            .deinit (s => s.client = undefined)
        ;
    })
;


test.method ("postgresql.Database", "select")
    .should ("select the rows from the database")
        .given ("users", { id: 1 }, "LIMIT 1")
        .mockClient ({ rows: [{ id: 1, user: "john" }] })
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
            LIMIT 1
        `)
        .commit ()

    .should ("treat value of the empty match key as the where expression")
        .given ("users", { "": "age > 10" })
        .mockClient ({ rows: [{ id: 1, user: "john" }] })
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE age > 10
        `)
        .commit ()

    .should ("return all rows if no condition was specified")
        .given ("users")
        .mockClient ({ rows: [{ id: 1, user: "john" }] })
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
        .mockClient ({ rows: [{ id: 1, user: "john" }] })
        .returns ([{ id: 1, user: "john" }])
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "find")
    .should ("return first the row that matches the criteria")
        .given ("users", { id: 1 })
        .mockClient ({ rows: [{ id: 1, user: "john" }] })
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
    .should ("execute the update statement")
        .given ("users", { name: "John" }, { id: 1 })
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            UPDATE "users"
            SET "name" = 'John'
            WHERE "id" = '1'
        `)
        .commit ()

    .should ("treat value of the empty match key as the where expression")
        .given ("users", { name: "John" }, { "": "age > 10" })
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            UPDATE "users"
            SET "name" = 'John'
            WHERE age > 10
        `)
        .commit ()

    .should ("use the Query object if provided")
        .given (
            nit.new ("postgresql.queries.Update")
                .$table ("users")
                .$set ("name", "John")
                .$where ("id", 1)
        )
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            UPDATE "users"
            SET "name" = 'John'
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "insert")
    .should ("execute the insert statement")
        .given ("users", { name: "John", id: 1 })
        .mockClient ({ rowCount: 1 })
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
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            INSERT INTO "users" ("name", "id")
            VALUES ('John', '1')
        `)
        .commit ()
;


test.method ("postgresql.Database", "upsert")
    .should ("perform an upsert")
        .given ("users", { name: "John"}, { id: 1 })
        .mockClient ({ rowCount: 1 })
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
        .mockClient ({ rowCount: 1 })
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
    .should ("perform the deletion")
        .given ("users", { id: 1 })
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()

    .should ("treat value of the empty match key as the where expression")
        .given ("users", { "": "age > 10" })
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE age > 10
        `)
        .commit ()

    .given ("users")
        .mockClient ({ rowCount: 3 })
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
        .mockClient ({ rowCount: 1 })
        .returns (1)
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            DELETE FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "query")
    .should ("format and execute a statement")
        .given ("SELECT * FROM users WHERE id = &1", 100)
        .mockClient ({ rows: [] })
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
        .mockClient ({ rows: [] })
        .returns ({ rows: [] })
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '1'
        `)
        .commit ()
;


test.method ("postgresql.Database", "fetchAll")
    .should ("return the rows for the given statement")
        .given ("SELECT * FROM users WHERE enabled = &1", true)
        .mockClient ({ rows:
        [
            { id: 1, name: "John", enabled: true },
            { id: 2, name: "Jane", enabled: true }
        ]})
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
    .should ("return a single row for the given statement")
        .given ("SELECT * FROM users WHERE enabled = &1", true)
        .mockClient ({ rows:
        [
            { id: 1, name: "John", enabled: true },
            { id: 2, name: "Jane", enabled: true }
        ]})
        .returns ({ id: 1, name: "John", enabled: true })
        .expectingPropertyToBe ("object.client.statement", nit.trim.text`
            SELECT * FROM users WHERE enabled = 'true'
        `)
        .commit ()
;


test.method ("postgresql.Database", "value")
    .should ("return the value for the first column of the first row")
        .given ("SELECT name FROM users WHERE enabled = &1", true)
        .mockClient ({ rows: [{ name: "John" }]})
        .returns ("John")
        .commit ()
;


test.method ("postgresql.Database", "begin")
    .should ("start a transaction")
        .mockClient ()
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.length", 1)
        .commit ()

    .should ("not start a new transaction if one exists")
        .mockClient ()
        .after (s => s.object.begin ())
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.Database", "commit")
    .should ("not commit if no transaction was started")
        .mockClient ()
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client", undefined)
        .commit ()

    .should ("commit if a transaction was started")
        .mockClient ()
        .before (s => s.object.begin ())
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "COMMIT")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()

    .should ("commit only once if called multiple times")
        .mockClient ()
        .before (s => s.object.begin ())
        .after (s => s.object.commit ())
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "COMMIT")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()
;


test.method ("postgresql.Database", "rollback")
    .should ("not rollback if no transaction was started")
        .mockClient ()
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client", undefined)
        .commit ()

    .should ("rollback if a transaction was started")
        .mockClient ()
        .before (s => s.object.begin ())
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "ROLLBACK")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()

    .should ("rollback only once if called multiple times")
        .mockClient ()
        .before (s => s.object.begin ())
        .after (async (s) =>
        {
            await s.object.rollback ();
            await s.object.rollback ();
        })
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client.statement", "ROLLBACK")
        .expectingPropertyToBe ("object.client.query.invocations.length", 2)
        .commit ()
;


test.method ("postgresql.Database", "transact")
    .should ("run tasks in a transaction")
        .mockClient ()
        .given (function ()
        {
            return 100;
        })
        .returns (100)
        .expectingPropertyToBe ("object.client.query.invocations.0.args.0", "BEGIN")
        .expectingPropertyToBe ("object.client.query.invocations.1.args.0", "COMMIT")
        .commit ()

    .should ("rollback if the task throws")
        .mockClient ()
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
    .should ("throw if the the statement caused an error")
        .mockClient ()
        .given ("SELECT that!")
        .mock ("client", "query", function ()
        {
            throw new Error ("Invalid syntax!");
        })
        .throws ("error.database_error")
        .expectingPropertyToBe ("error.message", "Database error: Invalid syntax!")
        .commit ()

    .should ("execute the given statement")
        .mockClient ({ rows: [{ "count": 3 }] })
        .given ("SELECT COUNT (*) FROM users")
        .returns ({ rows: [{ "count": 3 }] })
        .commit ()

    .should ("parse the value of an array column")
        .given ("SELECT * FROM users")
        .mockClient (
        {
            rows: [{ username: "johndoe", aliases: [JSON.stringify ({ n: "jd1" }), JSON.stringify ({ n: "jd2" })] }]
        })
        .returns ({
            rows: [{ username: "johndoe", aliases: [{ n: "jd1" }, { n: "jd2" }] }]
        })
        .commit ()
;


test.method ("postgresql.Database", "connect")
    .should ("set up the client")
        .mockClient ()
        .returnsInstanceOf (postgresql.Database)
        .commit ()

    .should ("only create the client if not connected")
        .mockClient ()
        .before (s => s.object.connect ())
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
    .should ("disconnect and release the client")
        .mockClient ()
        .before (s => s.object.connect ())
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("object.client", undefined)
        .commit ()

    .should ("only disconnect the client only if connected")
        .mockClient ()
        .before (s => s.object.connect ())
        .after (s => s.object.connect ())
        .returnsInstanceOf (postgresql.Database)
        .commit ()

    .should ("rollback the current transaction before disconnect")
        .mockClient ()
        .mock ("object", "rollback")
        .before (s => s.object.begin ())
        .returnsInstanceOf (postgresql.Database)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.Database", "disconnect", { createArgs: [{ pooling: true }] })
    .should ("issue DISCARD ALL before releasing the client to the pool")
        .mock ("object.client", "query")
        .before (s => s.object.connect ())
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
