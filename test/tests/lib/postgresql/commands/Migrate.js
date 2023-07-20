const MockPgClient = nit.require ("postgresql.mocks.PgClient");
const Migration = nit.require ("postgresql.Migration");
const CreateMigration = nit.require ("postgresql.commands.CreateMigration");


test.command ("postgresql.commands.Migrate")
    .should ("perform the migration")
        .application ()
        .mock (MockPgClient.prototype, "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock (Migration.table, "exists", true)
        .mock ("object", "info")
        .before (async function ()
        {
            await CreateMigration ().run ("create-users-table", { yes: true });

            let { dir } = this.context.input;
            let file = nit.File (dir.join (dir.read ()[0]));
            let content = file.read ().replace (/\.onUp[^}]+\{[^}]+\}\)/s, nit.trim.text`
            .onUp (function (db)
            {
                db.upCalled = true;
            })`);

            file.write (content);

            this.context.input.yes = true;
        })
        .expectingPropertyToBe ("context.db.upCalled", true)
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", "info.perform_migration")
        .expectingPropertyToBe ("mocks.0.invocations.2.result.command", "INSERT")
        .commit ()

    .should ("cancel if confirmation is declined")
        .application ()
        .mock (MockPgClient.prototype, "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock (Migration.table, "exists", true)
        .mock ("object", "confirm", false)
        .before (async function ()
        {
            await CreateMigration ().run ("create-users-table", { yes: true });
        })
        .commit ()

    .should ("show the info message if no migration is available")
        .application ()
        .mock (MockPgClient.prototype, "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock (Migration.table, "exists", true)
        .mock ("object", "info")
        .mock ("context.input.dir", "read", () => [])
        .before (async function ()
        {
            this.context.input.yes = true;
        })
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", "info.no_migration_required")
        .commit ()
;
