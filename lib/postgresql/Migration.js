module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Migration"))
        .categorize (true)
        .defineInnerClass ("Options", Options =>
        {
            Options
                .field ("migrationTable", "string", "The name of table that stores the migration info.", "Migrations")
                .field ("template", "nit.File", "The migration template file.", postgresql.HOME.join ("resources/postgresql/Migration.js"))
                .field ("dir", "nit.Dir", "The directory under which the migration should be generated.", "resources/migrations")
            ;
        })
        .staticMemo ("table", function ()
        {
            return nit.new ("postgresql.Table",
                Self.options.migrationTable,
                nit.new ("postgresql.Column", "name", { primaryKey: true }),
                nit.new ("postgresql.Column", "time", "TIMESTAMP WITHOUT TIME ZONE", { defval: "NOW ()" })
            );
        })
        .staticMemo ("options", function ()
        {
            return new Self.Options;
        })
        .staticMethod ("up", function (up)
        {
            return this.method ("up", up);
        })
        .staticMethod ("down", function (down)
        {
            return this.method ("down", down);
        })
        .method ("up", async function (db) {}) // eslint-disable-line no-unused-vars
        .method ("down", async function (db) {}) // eslint-disable-line no-unused-vars
    ;
};
