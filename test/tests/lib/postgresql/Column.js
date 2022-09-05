test.object ("postgresql.Column")
    .should ("represent a column of a postgresql table")
    .given ("username", "VARCHAR (255)", { primaryKey: true })
    .expectingPropertyToBe ("result.ddl", `"username" VARCHAR (255) PRIMARY KEY`)
    .commit ()

    .given ("userId", { unique: true, reference: "users" })
    .expectingPropertyToBe ("result.ddl", `"userId" TEXT UNIQUE REFERENCES "users"`)
    .commit ()

    .given ("userId", { unique: true, reference: { table: "users", column: "id" } })
    .expectingPropertyToBe ("result.ddl", `"userId" TEXT UNIQUE REFERENCES "users" ("id")`)
    .commit ()

    .given ("dateCreated", "TIMESTAMP", { defval: "NOW ()", nullable: false })
    .expectingPropertyToBe ("result.ddl", `"dateCreated" TIMESTAMP DEFAULT NOW () NOT NULL`)
    .commit ()
;
