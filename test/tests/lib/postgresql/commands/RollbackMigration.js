const CreateMigration = nit.require ("postgresql.commands.CreateMigration");


test.command ("postgresql.commands.RollbackMigration")
    .useMockPgClient ()
        .mock ("postgresql.Table.prototype", "exists", true)
        .mock ("object", "info")
        .before (s => s.context.serviceproviders.push (s.db))
        .init (s => s.db = undefined)
        .snapshot ()

    .should ("show the info message if no migrations to rollback")
        .application ()
        .mock ("db.client", "query", function (statement)
        {
            return this.result =
            {
                command: statement.split (/\s+/)[0],
                rows: []
            };
        })
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "info.no_rollback_need")
        .commit ()


    .should ("rollback one migration if count is not specified")
        .application ()
        .mock ("db.client", "query", function (statement)
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
        .before (s => s.context.serviceproviders.push (s.db))
        .before (async (s) =>
        {
            await CreateMigration ().run ("create-users-table", { yes: true });
            await s.context.validateInput ();

            let { dir } = s.context.input;
            let file = nit.File (dir.join (dir.read ()[0]));
            let content = file.read ().replace (/\.onDown[^}]+\{[^}]+\}\)/s, nit.trim.text`
            .onDown (function (db)
                    {
                        db.downCalled = true;
                    })
            `);

            file.write (content);

            s.context.input.yes = true;
        })
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "info.perform_rollback")
        .expectingPropertyToBe ("context.db.downCalled", true)
        .commit ()

    .should ("rollback specified number of migrations")
        .application ()
        .mock ("db.client", "query", function (statement)
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
        .before (s => s.context.serviceproviders.push (s.db))
        .before (async (s) =>
        {
            await CreateMigration ().run ("create-users-table", { yes: true });
            await CreateMigration ().run ("create-groups-table", { yes: true });
            await s.context.validateInput ();

            let { dir } = s.context.input;

            dir.read ().forEach (name =>
            {
                let file = nit.File (dir.join (name));
                let content = file.read ().replace (/\.onDown[^}]+\{[^}]+\}\)/s, nit.trim.text`
                .onDown (function (db)
                        {
                            db.downCalled = ~~db.downCalled + 1;
                        })
                `);

                file.write (content);
            });

            s.context.input.yes = true;
            s.context.input.count = 2;
        })
        .expectingPropertyToBe ("mocks.1.invocations.length", 2)
        .expectingPropertyToBe ("context.db.downCalled", 2)
        .commit ()

    .should ("cancel the rollback if the confirmation is declined")
        .application ()
        .before (s => s.context.serviceproviders.push (s.db))
        .mock ("db.client", "query", function (statement)
        {
            let command = statement.split (/\s+/)[0];
            let rows = [];

            if (command == "SELECT")
            {
                rows = [{ name: "00001-create-users.table.js" }];
            }

            return this.result = { command, rows };
        })
        .mock ("object", "confirm", false)
        .commit ()
;
