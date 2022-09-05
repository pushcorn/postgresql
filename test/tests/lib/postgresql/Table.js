nit.require ("postgresql.MockPgClient");


test.object ("postgresql.Table")
    .should ("represent a table of a postgresql database")
    .given ("users", { columns: [{ name: "id", primaryKey: true }, { name: "username", unique: true }] })
    .expectingPropertyToBe ("result.ddl", nit.trim.text`
        CREATE TABLE "users"
        (
            "id" TEXT PRIMARY KEY,
            "username" TEXT UNIQUE
        )
    `)
    .commit ()
;


test.method ("postgresql.Table", "column", { createArgs: ["users"] })
    .should ("add a column to the table")
    .given ("id", { primaryKey: true })
    .expectingPropertyToBe ("result.ddl", nit.trim.text`
        CREATE TABLE "users"
        (
            "id" TEXT PRIMARY KEY
        )
    `)
    .commit ()
;


test.method ("postgresql.Table", "create",
    {
        createArgs:
        {
            name: "users",
            columns: ["id", "username"]
        }
    })
    .should ("create the table")
    .given (nit.new ("postgresql.Database"))
    .before (async function ()
    {
        let db = this.args[0];

        await db.connect ();

        db.client.result =
        {
            command: "CREATE",
            rowCount: null
        };
    })
    .expectingPropertyToBe ("result",
    {
        command: "CREATE",
        rowCount: null
    })
    .expectingPropertyToBe ("args.0.client.statement", nit.trim.text`
        CREATE TABLE "users"
        (
            "id" TEXT,
            "username" TEXT
        )
    `)
    .commit ()
;


test.method ("postgresql.Table", "drop",
    {
        createArgs: ["users"]
    })
    .should ("drop the table")
    .given (nit.new ("postgresql.Database"))
    .before (async function ()
    {
        let db = this.args[0];

        await db.connect ();

        db.client.result =
        {
            command: "DROP",
            rowCount: null
        };
    })
    .expectingPropertyToBe ("result",
    {
        command: "DROP",
        rowCount: null
    })
    .expectingPropertyToBe ("args.0.client.statement", `DROP TABLE "users"`)
    .commit ()
;


test.method ("postgresql.Table", "exists",
    {
        createArgs: ["users"]
    })
    .should ("returns true if the table exists")
    .given (nit.new ("postgresql.Database"))
    .before (async function ()
    {
        let db = this.args[0];

        await db.connect ();

        db.client.result =
        {
            rows:
            [
            {
                schemaname: 'public',
                tablename: 'users',
                tableowner: 'postgres',
                tablespace: null,
                hasindexes: true,
                hasrules: false,
                hastriggers: false,
                rowsecurity: false
            }
            ]
        };
    })
    .returns (true)
    .commit ()
;
