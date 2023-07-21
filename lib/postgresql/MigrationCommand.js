module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("postgresql.MigrationCommand")
        .require ("postgresql.Migration")
        .defineInput (Input =>
        {
            Input
                .option ("migrationTable", "string", "The name of table that stores the migration info.", postgresql.Migration.options.migrationTable)
                .option ("dir", "nit.Dir", "The directory under which the migration are located.", postgresql.Migration.options.dir)
                .onPostConstruct (function ()
                {
                    nit.assign (postgresql.Migration.options, this.toPojo ());
                })
            ;
        })
        .defineContext (Context =>
        {
            Context
                .getter ("migrationTable", () => postgresql.Migration.table)
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
                .onPostConstruct (async function ()
                {
                    let { migrationTable, db } = this;

                    if (!await migrationTable.exists (db))
                    {
                        await migrationTable.create (db);
                    }
                })
            ;
        })
    ;
};
