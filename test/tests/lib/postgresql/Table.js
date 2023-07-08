nit.require ("postgresql.mocks.PgClient");


test.object ("postgresql.Table")
    .should ("represent a table of a postgresql database")
    .given ("users", { columns: [{ name: "id", primaryKey: true }, { name: "username", unique: true }] })
    .expectingPropertyToBe ("result.createSql", nit.trim.text`
        CREATE TABLE IF NOT EXISTS "users"
        (
            "id" TEXT NOT NULL,
            "username" TEXT,
            PRIMARY KEY ("id"),
            UNIQUE ("username")
        )
    `)
    .expectingPropertyToBe ("result.columnNames", ["id", "username"])
    .commit ()
;


test.method ("postgresql.Table", "$column", { createArgs: ["users"] })
    .should ("add a column to the table")
    .given ("id", { primaryKey: true })
    .expectingPropertyToBe ("result.createSql", nit.trim.text`
        CREATE TABLE IF NOT EXISTS "users"
        (
            "id" TEXT NOT NULL,
            PRIMARY KEY ("id")
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
    .before (async (s) =>
    {
        let db = s.object.db;

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
    .expectingPropertyToBe ("object.db.client.statement", nit.trim.text`
        CREATE TABLE IF NOT EXISTS "users"
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
    .before (async (s) =>
    {
        let db = s.object.db;

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
    .expectingPropertyToBe ("object.db.client.statement", `DROP TABLE IF EXISTS "users" CASCADE`)
    .commit ()
;


test.method ("postgresql.Table", "exists",
    {
        createArgs: ["users"]
    })
    .should ("returns true if the table exists")
    .before (async (s) =>
    {
        let db = s.object.db;

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


test.method ("postgresql.Table", "addColumn",
    {
        createArgs: ["users"]
    })
    .should ("add a column to the table")
    .before (async (s) =>
    {
        let db = s.object.db;

        await db.connect ();

        s.object.$column ("id", "integer", { primaryKey: true });
    })
    .given ("id")
    .expectingPropertyToBe ("object.db.client.statement", nit.trim.text`
        ALTER TABLE "users"
        ADD COLUMN "id" integer NOT NULL
    `)
    .commit ()
;


test.method ("postgresql.Table", "dropColumn",
    {
        createArgs: ["users"]
    })
    .should ("add a column to the table")
    .before (async (s) =>
    {
        let db = s.object.db;

        await db.connect ();

        s.object.$column ("id", "integer", { primaryKey: true });
    })
    .given ("id")
    .expectingPropertyToBe ("object.db.client.statement", nit.trim.text`
        ALTER TABLE "users"
        DROP COLUMN IF EXISTS "id"
    `)
    .commit ()
;


test.object ("postgresql.Table.Column")
    .should ("represent a column of a postgresql table")
    .given ("username", "VARCHAR (255)", { key : true })
    .expectingPropertyToBe ("result.sql", `"username" VARCHAR (255)`)
    .commit ()

    .given ("userId", { unique: true, reference: "users" })
    .expectingPropertyToBe ("result.sql", `"userId" TEXT`)
    .commit ()

    .given ("dateCreated", "TIMESTAMP", { defval: "NOW ()", nullable: false })
    .expectingPropertyToBe ("result.sql", `"dateCreated" TIMESTAMP NOT NULL DEFAULT NOW ()`)
    .commit ()
;


test.object ("postgresql.Table.Index")
    .should ("define a table index")
        .given ("users", "profile_id", "date", { method: "BTREE" })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_users_profile_id_date"
            ON "users" USING BTREE ("profile_id", "date")
        `)
        .commit ()

    .given ("users", "profile_id", "date", { method: "BTREE" })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_users_profile_id_date"
            ON "users" USING BTREE ("profile_id", "date")
        `)
        .commit ()

    .given ("users", { name: "idx_email", expression: "LOWER (email)" })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_email"
            ON "users" ((LOWER (email)))
        `)
        .commit ()

    .given ("users", "email", { where: "email IS NOT NULL" })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_users_email"
            ON "users" ("email")
            WHERE email IS NOT NULL
        `)
        .commit ()
;


test.object ("postgresql.Table.constraints.Unique")
    .should ("define a unique constraint")
        .given ("users", "email")
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "users"
            ADD CONSTRAINT "users_email_uk" UNIQUE ("email")
        `)
        .commit ()

    .given ("users", "email", { name: "users_uk" })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "users"
            ADD CONSTRAINT "users_uk" UNIQUE ("email")
        `)
        .commit ()
;


test.object ("postgresql.Table.constraints.ForeignKey")
    .should ("define a foreign key constraint")
        .given ("orderComments", "order_id", "product_id", "orderItem")
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "orderComments"
            ADD CONSTRAINT "orderComments_order_id_product_id_fk" FOREIGN KEY ("order_id", "product_id")
            REFERENCES "orderItem"
        `)
        .commit ()

    .should ("define a foreign key constraint")
        .given ("orderComments", "order_id", "product_id", "orderItem", { deleteAction: "CASCADE", deferred: true })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "orderComments"
            ADD CONSTRAINT "orderComments_order_id_product_id_fk" FOREIGN KEY ("order_id", "product_id")
            REFERENCES "orderItem"
            ON DELETE CASCADE
            INITIALLY DEFERRED
        `)
        .commit ()

    .should ("define a foreign key constraint")
        .given ("orderComments", "order_id", "product_id", "orderItem",
        {
            name: "orderComments_oid_pid_fk",
            referencedColumns: ["oid", "pid"]
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "orderComments"
            ADD CONSTRAINT "orderComments_oid_pid_fk" FOREIGN KEY ("order_id", "product_id")
            REFERENCES "orderItem" ("oid", "pid")
        `)
        .commit ()
;


test.object ("postgresql.Table.constraints.Check")
    .should ("define a check constraint")
        .given ("users", "age > 10")
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "users"
            ADD CONSTRAINT "users_1_chk" CHECK (age > 10)
        `)
        .commit ()

    .should ("define a check constraint")
        .given ("users", "age > 10", { name: "check_age" })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            ALTER TABLE "users"
            ADD CONSTRAINT "check_age" CHECK (age > 10)
        `)
        .commit ()
;


test.method ("postgresql.Table", "$constraint", { createArgs: ["users"] })
    .should ("add a constraint to the table")
    .given ("unique", "email")
    .returnsInstanceOf ("postgresql.Table")
    .expectingPropertyToBe ("result.constraints.length", 1)
    .expectingPropertyToBeOfType ("result.constraints.0", "postgresql.Table.constraints.Unique")
    .commit ()
;


test.method ("postgresql.Table", "$index", { createArgs: ["users"] })
    .should ("add an index to the table")
    .given ("email")
    .returnsInstanceOf ("postgresql.Table")
    .expectingPropertyToBe ("result.indexes.length", 1)
    .expectingPropertyToBeOfType ("result.indexes.0", "postgresql.Table.Index")
    .commit ()
;

