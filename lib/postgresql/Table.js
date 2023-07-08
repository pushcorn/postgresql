module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Table", "postgresql.Clause"))
        .defineClause ("Column", Column =>
        {
            Column
                .sql (`
                    @name %{type}%{#?array}[]%{/}%{#?notNull} NOT NULL%{/}%{#+defval} DEFAULT %{defval}%{/}
                `)
                .field ("<name>", "string", "The column name.")
                .field ("[type]", "string", "The column type.", "TEXT")
                .field ("primaryKey", "boolean", "Whether the column is a primary key.")
                .field ("unique", "boolean", "Whether the value should be unique.")
                .field ("defval", "any", "The default value")
                .field ("nullable", "boolean", "Whether the column can be null.", true)
                .field ("array", "boolean")

                .getter ("notNull", function ()
                {
                    return !this.nullable || this.primaryKey;
                })
            ;
        })
        .defineClause ("Index", Index =>
        {
            Index
                .sql (`
                    CREATE INDEX IF NOT EXISTS @dn
                    ON @table%{#+method} USING %{method}%{/} (%{#columns}%{$FIRST ? '' : ', '}%{.|id}%{/}%{#+expression}(%{expression})%{/})%{#+where}
                    WHERE %{where}%{/}
                `)
                .field ("<table>", "string")
                .field ("[columns...]", "string")
                .field ("method", "string")
                .field ("expression", "string")
                .field ("where", "string")
                .field ("name", "string")
                .getter ("dn", function ()
                {
                    return this.name || `idx_${this.table}_${this.columns.join ("_")}`;
                })
            ;
        })

        .defineClause ("Constraint", Constraint =>
        {
            Constraint
                .categorize ("postgresql.Table.constraints")
                .field ("<table>", "string")
            ;

            Self.defineConstraint ("Unique")
                .sql (`
                    ALTER TABLE @table
                    ADD CONSTRAINT @dn UNIQUE (%{#columns}%{.|id}%{$LAST ? '' : ', '}%{/})
                `)
                .field ("<columns...>", "string")
                .field ("name", "string")
                .getter ("dn", function ()
                {
                    return this.name || `${this.table}_${this.columns.join ("_")}_uk`;
                })
            ;

            Self.defineConstraint ("Check")
                .sql (`
                    ALTER TABLE @table
                    ADD CONSTRAINT @dn CHECK (%{expr})
                `)
                .staticProperty ("seqMap", "object")
                .field ("<expr>", "string")
                .field ("name", "string")
                .memo ("seq", function ()
                {
                    let cls = this.constructor;
                    let seq = ~~cls.seqMap[this.table] + 1;

                    cls.seqMap[this.table] = seq;

                    return seq;
                })
                .getter ("dn", function ()
                {
                    return this.name || `${this.table}_${this.seq}_chk`;
                })
            ;

            Self.defineConstraint ("ForeignKey")
                .sql (`
                    ALTER TABLE @table
                    ADD CONSTRAINT @dn FOREIGN KEY (%{#columns}%{.|id}%{$LAST ? '' : ', '}%{/})
                    REFERENCES @referencedTable%{#+referencedColumns} (%{#referencedColumns}%{.|id}%{$LAST ? '' : ', '}%{/})%{/}%{#+deleteAction}
                    ON DELETE %{deleteAction}%{/}%{#+updateAction}
                    ON UPDATE %{updateAction}%{/}%{#?deferred}
                    INITIALLY DEFERRED%{/}
                `)
                .field ("<columns...>", "string")
                .field ("<referencedTable>", "string")
                .field ("referencedColumns...", "string")
                .field ("deferred", "boolean")
                .field ("deleteAction", "string")
                    .constraint ("choice", "NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT")
                .field ("updateAction", "string")
                    .constraint ("choice", "NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT")
                .field ("name", "string")
                .getter ("dn", function ()
                {
                    return this.name || `${this.table}_${this.columns.join ("_")}_fk`;
                })
            ;
        })

        .defineClause ("Action", Action =>
        {
            Action
                .categorize ("postgresql.Table.actions")
                .field ("<table>", "string")
            ;

            Self
                .defineAction ("AddColumn")
                .sql (`
                    ALTER TABLE @table
                    ADD COLUMN %{column.sql}
                `)
                .field ("<column>", Self.Column.name)
            ;

            Self
                .defineAction ("DropColumn")
                .sql (`
                    ALTER TABLE @table
                    DROP COLUMN IF EXISTS %{column.name|id}
                `)
                .field ("<column>", Self.Column.name)
            ;
        })

        .template ("createSql", `
            CREATE TABLE IF NOT EXISTS @name
            (%{#columns}
                %{sql}%{$LAST ? '' : ','}%{/}%{#+primaryKeys},
                PRIMARY KEY (%{#primaryKeys}%{name|id}%{$LAST ? '' : ', '}%{/})%{/}%{#uniqueKeys},
                UNIQUE (%{name|id})%{/}
            )
        `)
        .template ("dropSql", `
            DROP TABLE IF EXISTS @name CASCADE
        `)

        .field ("<name>", "string", "The table name.")
        .field ("[columns...]", Self.Column.name, "The table columns.")
        .field ("constraints...", "postgresql.Table.Constraint", "The table constraints.")
        .field ("indexes...", "postgresql.Table.Index", "The indexes.")

        .memo ("primaryKeys", function ()
        {
            return this.columns.filter (c => c.primaryKey);
        })
        .memo ("uniqueKeys", function ()
        {
            return this.columns.filter (c => c.unique);
        })
        .memo ("columnNames", function ()
        {
            return this.columns.map (c => c.name);
        })
        .property ("db", "postgresql.Database",
        {
            getter: function (db)
            {
                return db || postgresql.Database.shared;
            }
        })

        .method ("$column", function (name, type) // eslint-disable-line no-unused-vars
        {
            this.columns.push (new Self.Column (...arguments));

            Self.invalidateProperty ("columnNames", this);

            return this;
        })
        .method ("$constraint", function (name)
        {
            let cls = Self.constraints[nit.ucFirst (name)];
            let constraint = new cls (this.name, ...nit.array (arguments).slice (1));

            this.constraints.push (constraint);

            return this;
        })
        .method ("$index", function ()
        {
            this.indexes.push (new Self.Index (this.name, ...arguments));

            return this;
        })
        .method ("create", async function ()
        {
            return await this.db.query (this.createSql);
        })
        .method ("drop", async function ()
        {
            return await this.db.query (this.dropSql);
        })
        .method ("exists", async function ()
        {
            return !!(await this.db.find ("pg_tables", { tablename: this.name }));
        })
        .method ("addColumn", async function (name)
        {
            let column = this.columns.find (c => c.name == name);
            let action = new Self.actions.AddColumn (this.name, column);

            return await this.db.query (action.sql);
        })
        .method ("dropColumn", async function (name)
        {
            let column = this.columns.find (c => c.name == name);
            let action = new Self.actions.DropColumn (this.name, column);

            return await this.db.query (action.sql);
        })
    ;
};
