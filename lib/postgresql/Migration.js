module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Migration"))
        .categorize (true)
        .defineMeta ("tableName", "string", "migrations") // The name of table that stores the migration info.
        .defineMeta ("template", "nit.File", postgresql.HOME.join ("resources/postgresql/Migration.js")) // The migration template file.
        .defineMeta ("dir", "nit.Dir", "resources/migrations") // The directory under which the migration should be generated.
        .staticMemo ("table", function ()
        {
            return nit.new ("postgresql.Table", Self.tableName)
                .$column ("name", { primaryKey: true })
                .$column ("time", "TIMESTAMP WITHOUT TIME ZONE", { defval: "NOW ()" })
            ;
        })
        .staticProperty ("db", "postgresql.Database") // The database used for the migration.
        .staticLifecycleMethod ("up", null, async function (db) {}) // eslint-disable-line no-unused-vars
        .staticLifecycleMethod ("down", null, async function (db) {}) // eslint-disable-line no-unused-vars
    ;
};
