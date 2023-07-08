module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Migration"))
        .categorize (true)
        .defineInnerClass ("Options", Options =>
        {
            Options
                .field ("migrationTable", "string", "The name of table that stores the migration info.", "migrations")
                .field ("template", "nit.File", "The migration template file.", postgresql.HOME.join ("resources/postgresql/Migration.js"))
                .field ("dir", "nit.Dir", "The directory under which the migration should be generated.", "resources/migrations")
            ;
        })
        .staticMemo ("table", function ()
        {
            return nit.new ("postgresql.Table", Self.options.migrationTable)
                .$column ("name", { primaryKey: true })
                .$column ("time", "TIMESTAMP WITHOUT TIME ZONE", { defval: "NOW ()" })
            ;
        })
        .staticMemo ("options", function ()
        {
            return new Self.Options;
        })

        .field ("<db>", "postgresql.Database", "The database used for the migration.")
        .lifecycleMethod ("up", null, async function (db) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("down", null, async function (db) {}) // eslint-disable-line no-unused-vars
    ;
};
