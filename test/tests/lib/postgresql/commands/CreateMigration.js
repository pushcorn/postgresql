nit.require ("postgresql.mocks.PgClient");


test.command ("postgresql.commands.CreateMigration")
    .should ("create a migration file")
        .given ("Create users table", { yes: true })
        .app ()
        .after (function ()
        {
            this.firstFile = this.context.input.dir.read ()[0];
        })
        .expectingPropertyToBe ("firstFile", /create-users-table/)
        .commit ()

    .should ("cancel if confirmation was declined")
        .given ("Create users table")
        .mock ("object", "confirm", false)
        .mock ("context.input.dir", "create")
        .expectingPropertyToBe ("mocks.1.invocations.length", 0)
        .commit ()
;


test.method ("postgresql.commands.CreateMigration", "generatePrefix", true)
    .should ("generate a prefix with the current timestamp")
        .returns (/^\d{14}$/)
        .commit ()
;


test.method ("postgresql.commands.CreateMigration", "sanitizeName", true)
    .should ("replace invalid characters with a '-'")
        .given ("update the column users.name")
        .returns ("update-the-column-users-name")
        .commit ()
;
