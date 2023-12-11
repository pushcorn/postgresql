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


test.method ("postgresql.Table", "Column", { createArgs: ["users"] })
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


test.method ("postgresql.Table", "create")
    .should ("create the table")
        .up (s => s.createArgs =
        {
            name: "users",
            columns: ["id", "username"]
        })
        .returnsInstanceOf ("postgresql.Table")
        .expectingPropertyToBe ("object.db.client.statement", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "users"
            (
                "id" TEXT,
                "username" TEXT
            )
        `)
        .commit ()

    .should ("return if the table already exists")
        .up (s => s.createArgs =
        {
            name: "users",
            columns: ["id", "username"]
        })
        .returnsInstanceOf ("postgresql.Table")
        .mock ("object", "exists", true)
        .before (s => s.object.db.client.statement = "")
        .expectingPropertyToBe ("object.db.client.statement", "")
        .commit ()

    .should ("create the table and the indexes and constraints if all = true")
        .up (s => s.createArgs =
        {
            name: "clients",
            columns: ["id", "username"]
        })
        .given (true)
        .before (s => s.object.db = nit.new ("postgresql.Database"))
        .before (s => s.object.Index ("username"))
        .before (s => s.object.Constraint ("check", "LENGTH (username) > 10"))
        .returnsInstanceOf ("postgresql.Table")
        .expectingPropertyToBe ("object.db.client.statements.0", nit.trim.text`
            SELECT *
            FROM "pg_tables"
            WHERE "tablename" = 'clients'
            LIMIT 1
        `)
        .expectingPropertyToBe ("object.db.client.statements.1", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "clients"
            (
                "id" TEXT,
                "username" TEXT
            )
        `)
        .expectingPropertyToBe ("object.db.client.statements.2", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_clients_username"
            ON "clients" ("username")
        `)
        .expectingPropertyToBe ("object.db.client.statements.3", nit.trim.text`
            ALTER TABLE "clients"
            ADD CONSTRAINT "clients_1_chk" CHECK (LENGTH (username) > 10)
        `)
        .commit ()
;


test.method ("postgresql.Table", "drop", { createArgs: ["users"] })
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


test.method ("postgresql.Table", "exists", { createArgs: ["users"] })
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


test.method ("postgresql.Table", "addColumn", { createArgs: ["users"] })
    .should ("add a column to the table")
        .before (async (s) =>
        {
            let db = s.object.db;

            await db.connect ();

            s.object.Column ("id", "integer", { primaryKey: true });
        })
        .given ("id")
        .expectingPropertyToBe ("object.db.client.statement", nit.trim.text`
            ALTER TABLE "users"
            ADD COLUMN "id" integer NOT NULL
        `)
        .commit ()
;


test.method ("postgresql.Table", "dropColumn", { createArgs: ["users"] })
    .should ("add a column to the table")
        .before (async (s) =>
        {
            let db = s.object.db;

            await db.connect ();

            s.object.Column ("id", "integer", { primaryKey: true });
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


test.method ("postgresql.Table", "Constraint", { createArgs: ["users"] })
    .should ("add a constraint to the table")
        .given ("unique", "email")
        .returnsInstanceOf ("postgresql.Table")
        .expectingPropertyToBe ("result.constraints.length", 1)
        .expectingPropertyToBeOfType ("result.constraints.0", "postgresql.Table.constraints.Unique")
        .commit ()
;


test.method ("postgresql.Table", "Index", { createArgs: ["users"] })
    .should ("add an index to the table")
        .given ("email")
        .returnsInstanceOf ("postgresql.Table")
        .expectingPropertyToBe ("result.indexes.length", 1)
        .expectingPropertyToBeOfType ("result.indexes.0", "postgresql.Table.Index")
        .commit ()
;


test.method ("postgresql.Table", "patch")
    .should ("alter the settings to that of the given table")
        .up (s => s.createArgs =
        {
            name: "users",
            columns:
            [
            {
                name: "id",
                type: "TEXT"
            }
            ,
            {
                name: "age",
                type: "TEXT"
            }
            ,
            {
                name: "firstname",
                type: "TEXT",
                defval: "''"
            }
            ,
            {
                name: "lastname",
                type: "TEXT"
            }
            ,
            {
                name: "url",
                type: "TEXT",
                nullable: false
            }
            ,
            {
                name: "role_id",
                type: "TEXT"
            }
            ,
            {
                name: "hobbies",
                type: "TEXT"
            }
            ]
        })
        .given (nit.new ("postgresql.Table",
        {
            name: "users",
            columns:
            [
            {
                name: "id",
                type: "TEXT"
            }
            ,
            {
                name: "age",
                type: "INTEGER",
                defval: 10
            }
            ,
            {
                name: "firstname",
                type: "TEXT",
                nullable: false
            }
            ,
            {
                name: "email",
                type: "TEXT"
            }
            ,
            {
                name: "url",
                type: "TEXT"
            }
            ,
            {
                name: "role_id",
                type: "TEXT"
            }
            ,
            {
                name: "hobbies",
                type: "TEXT",
                array: true
            }
            ]
        }))
        .before (s => s.object.db = nit.new ("postgresql.Database"))
        .before (s => s.object.Index ("firstname", "lastname"))
        .before (s => s.object.Index ("email", { method: "GIN" }))
        .before (s => s.object.Constraint ("check", "LENGTH (firstname) > 10"))
        .before (s => s.object.Constraint ("foreign-key", "role_id", "roles"))
        .before (s => s.args[0].Index ("firstname"))
        .before (s => s.args[0].Index ("email", { method: "BTREE" }))
        .before (s => s.args[0].Constraint ("check", "LENGTH (firstname) > 20"))
        .before (s => s.args[0].Constraint ("unique", "email"))
        .expectingMethodToReturnValue ("object.db.client.statements.join", "\n--\n", nit.trim.text`
            ALTER TABLE "users"
            ADD COLUMN "email" TEXT
            --
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "lastname"
            --
            ALTER TABLE "users"
            ALTER COLUMN "age" TYPE INTEGER
            --
            ALTER TABLE "users"
            ALTER COLUMN "age" SET DEFAULT 10
            --
            ALTER TABLE "users"
            ALTER COLUMN "firstname" DROP DEFAULT
            --
            ALTER TABLE "users"
            ALTER COLUMN "firstname" SET NOT NULL
            --
            ALTER TABLE "users"
            ALTER COLUMN "url" DROP NOT NULL
            --
            ALTER TABLE "users"
            ALTER COLUMN "hobbies" TYPE TEXT[]
            --
            ALTER TABLE "users"
            ADD CONSTRAINT "users_email_uk" UNIQUE ("email")
            --
            ALTER TABLE "users"
            DROP CONSTRAINT IF EXISTS "users_role_id_fk"
            --
            ALTER TABLE "users"
            DROP CONSTRAINT IF EXISTS "users_1_chk"
            --
            ALTER TABLE "users"
            ADD CONSTRAINT "users_1_chk" CHECK (LENGTH (firstname) > 20)
            --
            CREATE INDEX IF NOT EXISTS "idx_users_firstname"
            ON "users" ("firstname")
            --
            DROP INDEX IF EXISTS "idx_users_firstname_lastname"
            --
            DROP INDEX IF EXISTS "idx_users_email"
            --
            CREATE INDEX IF NOT EXISTS "idx_users_email"
            ON "users" USING BTREE ("email")
        `)
        .commit ()

    .should ("skip the action if the filter returns false")
        .up (s => s.createArgs =
        {
            name: "users",
            columns:
            [
            {
                name: "id",
                type: "TEXT"
            }
            ,
            {
                name: "age",
                type: "TEXT"
            }
            ,
            {
                name: "url",
                type: "TEXT",
                nullable: false
            }
            ]
        })
        .given (nit.new ("postgresql.Table",
        {
            name: "users",
            columns:
            [
            {
                name: "id",
                type: "TEXT"
            }
            ,
            {
                name: "age",
                type: "INTEGER",
                defval: 10
            }
            ,
            {
                name: "url",
                type: "TEXT"
            }
            ]
        }), action => !(action.constructor.simpleName == "AlterColumn" && action.column.name == "age"))
        .before (s => s.object.db = nit.new ("postgresql.Database"))
        .expectingMethodToReturnValue ("object.db.client.statements.join", "\n--\n", nit.trim.text`
            ALTER TABLE "users"
            ALTER COLUMN "url" DROP NOT NULL
        `)
        .commit ()
;
