module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Table"))
        .field ("<name>", "string", "The table name.")
        .field ("[columns...]", "postgresql.Column", "The table columns.")

        .constant ("DDL_TEMPLATE", nit.trim.text`
            CREATE TABLE @name
            (%{#columns}
                %{ddl}%{$LAST ? '' : ','}%{/}
            )
        `)

        .getter ("ddl", function ()
        {
            return postgresql.format (Self.DDL_TEMPLATE, this.toPojo (true));
        })
        .method ("column", function (name, type) // eslint-disable-line no-unused-vars
        {
            this.columns.push (nit.new ("postgresql.Column", arguments));

            return this;
        })
        .method ("create", async function (db)
        {
            return await db.query (this.ddl);
        })
        .method ("drop", async function (db)
        {
            return await db.query ("DROP TABLE @1", this.name);
        })
        .method ("exists", async function (db)
        {
            return !!(await db.find ("pg_tables", { tablename: this.name }));
        })
    ;
};
