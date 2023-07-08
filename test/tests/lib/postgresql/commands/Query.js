const MockPgClient = nit.require ("postgresql.mocks.PgClient");


test.command ("postgresql.commands.Query")
    .should ("output each row for the select query")
    .given ("SELECT * FROM @1 WHERE id = &2", "users", 1)
    .mock (MockPgClient.prototype, "query", function (statement)
    {
        this.statement = statement;

        return this.result = { command: "SELECT", rows: [{ id: 3 }, { id: 4 }] };
    })
    .mock (nit, "inspect")
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", `SELECT * FROM "users" WHERE id = '1'`)
    .expectingPropertyToBe ("mocks.1.invocations.length", 2)
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", { id: 3 })
    .expectingPropertyToBe ("mocks.1.invocations.1.args.0", { id: 4 })
    .commit ()

    .should ("output the number of affected rows for other type of queries")
    .given ("UPDATE @1 SET name = &2 WHERE id = &3", "users", "John", 1)
    .mock (MockPgClient.prototype, "query", function (statement)
    {
        this.statement = statement;

        return this.result = { command: "UPDATE", rowCount: 1 };
    })
    .mock (nit, "inspect")
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", `UPDATE "users" SET name = 'John' WHERE id = '1'`)
    .expectingPropertyToBe ("mocks.1.invocations.length", 1)
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "UPDATE")
    .expectingPropertyToBe ("mocks.1.invocations.0.args.1", 1)
    .commit ()
;
