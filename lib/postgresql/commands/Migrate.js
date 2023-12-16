module.exports = function (nit)
{
    return nit.defineCommand ("postgresql.commands.Migrate", "postgresql.MigrationCommand")
        .describe ("Peform database migrations.")
        .m ("info.perform_migration", "Peform migration %{name}.")
        .m ("info.no_migration_required", "No migration required.")
        .m ("info.confirm_migration", "Are you sure you want to perform the database migration(s)?")
        .m ("info.confirm_migration", nit.trim.text`
            The following migrations will be performed:%{#unmigrated}
                %{.}%{/}

            Do you want to continue?
        `)

        .defineInput (Input =>
        {
            Input
                .option ("count", "integer", "Number of migrationts to perform.", Infinity, { order: 1 })
                    .constraint ("min", 1)
                .option ("yes", "boolean", "Perform migrations without confirmation.")
            ;
        })
        .onRun (async function (ctx)
        {
            let { input: { dir, yes, count }, db } = ctx;
            let unmigrated = await ctx.getUnmigratedScripts ();

            if (unmigrated.length)
            {
                unmigrated = unmigrated.slice (0, count);

                if (!yes && !await this.confirm ("info.confirm_migration", { unmigrated }))
                {
                    return;
                }

                await db.transact (async () =>
                {
                    for (let name of unmigrated)
                    {
                        let file = dir.join (name);
                        let Migration = nit.require (file);

                        Migration.db = db;

                        this.info ("info.perform_migration", { name });

                        await Migration.up (db);
                        await db.insert (ctx.migrationTable.name, { name });
                    }
                });
            }
            else
            {
                this.info ("info.no_migration_required");
            }
        })
    ;
};
