module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineCommand ("postgresql.MigrationCommand"))
        .use ("postgresql.Migration")
        .defineInput (Input =>
        {
            Input
                .option ("migrationTable", "string", "The name of table that stores the migration info.", Self.Migration.tableName)
                .option ("dir", "nit.Dir", "The directory under which the migration are located.", Self.Migration.dir)
            ;
        })
        .defineContext (Context =>
        {
            Context
                .getter ("migrationTable", function ()
                {
                    return nit.assign (postgresql.Migration.table, { db: this.db });
                })
                .method ("getMigratedScripts", async function ()
                {
                    return (await this.db.select (this.migrationTable.name, null, "ORDER BY name DESC"))
                        .map (r => r.name)
                    ;
                })
                .method ("getUnmigratedScripts", async function ()
                {
                    let migrated = nit.index (await this.getMigratedScripts (), null, true);

                    return this.input.dir.read ()
                        .filter (f => !migrated[f])
                        .sort ()
                    ;
                })
            ;
        })
        .configureComponentMethods ("run", function (Queue)
        {
            Queue.after ("preRun", async function (command, { migrationTable })
            {
                await migrationTable?.create ();
            });
        })
    ;
};
