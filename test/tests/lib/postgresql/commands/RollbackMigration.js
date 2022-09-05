const Migration = nit.require ("postgresql.Migration");
const CreateMigration = nit.require ("postgresql.commands.CreateMigration");

nit.require ("postgresql.MockPgClient");



test.command ("postgresql.commands.RollbackMigration")
    .mock (Migration.table, "exists", true)
    .snapshot ()

    .should ("show the info message if no migrations to rollback")
        .app ()
        .mock ("context.db.client", "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .mock ("object", "log")
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", "info.no_rollback_need")
        .commit ()


    .should ("rollback one migration if count is not specified")
        .app ()
        .mock ("context.db.client", "query", function (statement)
        {
            let { strategy } = this;
            let command = statement.split (/\s+/)[0];
            let rows = [];

            if (command == "SELECT")
            {
                let { dir } = strategy.context.input;

                rows = dir.read ().map (name => ({ name }));
            }

            return this.result = { command, rows };
        })
        .mock ("object", "log")
        .before (async function ()
        {
            await CreateMigration.run ("create-users-table", { yes: true });

            let { dir } = this.context.input;
            let file = nit.File (dir.join (dir.read ()[0]));
            let content = file.read ().replace (/\.down[^}]+\{[^}]+\}\)/s, nit.trim.text`
            .down (function (db)
            {
                db.downCalled = true;
            })`);

            file.write (content);

            this.context.input.yes = true;
        })
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", "info.perform_rollback")
        .expectingPropertyToBe ("context.db.downCalled", true)
        .commit ()

    .should ("rollback specified number of migrations")
        .app ()
        .mock ("context.db.client", "query", function (statement)
        {
            let { strategy } = this;
            let command = statement.split (/\s+/)[0];
            let rows = [];

            if (command == "SELECT")
            {
                let { dir } = strategy.context.input;

                rows = dir.read ().map (name => ({ name }));
            }

            return this.result = { command, rows };
        })
        .mock ("object", "log")
        .before (async function ()
        {
            await CreateMigration.run ("create-users-table", { yes: true });
            await CreateMigration.run ("create-groups-table", { yes: true });

            let { dir } = this.context.input;

            dir.read ().forEach (name =>
            {
                let file = nit.File (dir.join (name));
                let content = file.read ().replace (/\.down[^}]+\{[^}]+\}\)/s, nit.trim.text`
                .down (function (db)
                {
                    db.downCalled = ~~db.downCalled + 1;
                })`);

                file.write (content);
            });

            this.context.input.yes = true;
            this.context.input.count = 2;
        })
        .expectingPropertyToBe ("mocks.2.invocations.length", 2)
        .expectingPropertyToBe ("context.db.downCalled", 2)
        .commit ()

    .should ("cancel the rollback if the confirmation is declined")
        .app ()
        .mock ("context.db.client", "query", function (statement)
        {
            let command = statement.split (/\s+/)[0];
            let rows = [];

            if (command == "SELECT")
            {
                rows = [{ name: "00001-create-users.table.js" }];
            }

            return this.result = { command, rows };
        })
        .mock ("object", "log")
        .mock ("object", "confirm", false)
        .commit ()
;
