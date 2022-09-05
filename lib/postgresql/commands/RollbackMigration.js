module.exports = function (nit)
{
    return nit.defineCommand ("postgresql.commands.RollbackMigration", "postgresql.MigrationCommand")
        .describe ("Rollback database migrations.")
        .m ("info.perform_rollback", "Rollback migration %{name}.")
        .m ("info.no_rollback_need", "No migrations to rollback.")
        .m ("info.confirm_rollback", nit.trim.text`
            The following migrations will be rolled back:%{#migrated}
                %{.}%{/}

            Do you want to continue?
        `)

        .defineInput (Input =>
        {
            Input
                .option ("count", "integer", "Number of migrationts to rollback.", 1)
                    .constraint ("min", 1)
                .option ("yes", "boolean", "Rollback migration(s) without confirmation.")
            ;
        })
        .method ("run", async function (ctx)
        {
            let { input: { dir, yes, count }, db } = ctx;
            let migrated = await ctx.getMigratedScripts ();

            if (migrated.length)
            {
                migrated = migrated.slice (0, count);

                if (!yes && !await this.confirm ("info.confirm_rollback", { migrated }))
                {
                    return;
                }

                await db.transact (async () =>
                {
                    for (let name of migrated)
                    {
                        let file = dir.join (name);
                        let migration = new (nit.require (file));

                        this.log ("info.perform_rollback", { name });

                        await migration.down (db);
                        await db.delete (ctx.migrationTable.name, { name });
                    }
                });
            }
            else
            {
                this.log ("info.no_rollback_need");
            }
        })
    ;
};
