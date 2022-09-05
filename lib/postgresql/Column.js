module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Column"))
        .defineInnerClass ("Reference", Reference =>
        {
            Reference
                .field ("<table>", "string", "The table name.")
                .field ("[column]", "string", "The referenced column name.")

                .constant ("DDL_TEMPLATE",
                    "@table" +
                    "%{#+column} (@column)%{/}"
                )
                .getter ("ddl", function ()
                {
                    return postgresql.format (Reference.DDL_TEMPLATE, this.toPojo (true));
                })
            ;
        })
        .field ("<name>", "string", "The column name.")
        .field ("[type]", "string", "The column type.", "TEXT")
        .field ("primaryKey", "boolean", "Whether the column is a primary key.")
        .field ("unique", "boolean", "Whether the value should be unique.")
        .field ("defval", "any", "The default value")
        .field ("nullable", "boolean", "Whether the column can be null.", true)
        .field ("reference", "postgresql.Column.Reference", "The foreign key constraint.")

        .constant ("DDL_TEMPLATE",
            "@name %{type}%{#?primaryKey} PRIMARY KEY%{/}" +
            "%{#+defval} DEFAULT %{defval}%{/}" +
            "%{#!nullable} NOT NULL%{/}" +
            "%{#?unique} UNIQUE%{/}" +
            "%{#+reference} REFERENCES %{reference.ddl}%{/}"
        )

        .getter ("ddl", function ()
        {
            let data = this.toPojo (true);

            data.reference = this.reference;

            return postgresql.format (Self.DDL_TEMPLATE, data);
        })
    ;
};
