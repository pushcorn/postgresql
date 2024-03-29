const Migration = nit.require ("postgresql.Migration");
const CreateMigration = nit.require ("postgresql.commands.CreateMigration");


test.command ("postgresql.commands.Migrate")
    .useMockPgClient ()
        .snapshot ()

    .should ("perform the migration")
        .application ()
        .mock ("db.client", "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock ("postgresql.Table.prototype", "exists", true)
        .mock ("object", "info")
        .before (s => s.context.serviceproviders.push (s.db))
        .before (async (s) =>
        {
            await CreateMigration ().run ("create-users-table", { yes: true });
            await s.context.validateInput ();

            let { dir } = s.context.input;
            let file = nit.File (dir.join (dir.read ()[0]));
            let content = file.read ().replace (/\.onUp[^}]+\{[^}]+\}\)/s, nit.trim.text`
            .onUp (function (db)
            {
                db.upCalled = true;
            })`);

            file.write (content);

            s.context.input.yes = true;
        })
        .expectingPropertyToBe ("context.db.upCalled", true)
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", "info.perform_migration")
        .expectingPropertyToBe ("mocks.0.invocations.2.result.command", "INSERT")
        .commit ()

    .should ("cancel if confirmation is declined")
        .application ()
        .mock ("db.client", "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock (Migration.table, "exists", true)
        .mock ("object", "confirm", false)
        .before (s => s.context.serviceproviders.push (s.db))
        .before (async function ()
        {
            await CreateMigration ().run ("create-users-table", { yes: true });
        })
        .commit ()

    .should ("show the info message if no migration is available")
        .application ()
        .mock ("db.client", "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock (Migration.table, "exists", true)
        .mock ("object", "info")
        .before (s => s.context.validateInput ())
        .before (s => s.context.serviceproviders.push (s.db))
        .before (async (s) =>
        {
            await s.context.validateInput ();

            s.context.input.yes = true;
            s.mock ("context.input.dir", "read", () => []);
        })
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", "info.no_migration_required")
        .commit ()
;
