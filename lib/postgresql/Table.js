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
                .property ("owner", "postgresql.Table")
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
                .field ("[name]", "string")
                .memo ("seq", function ()
                {
                    let cls = this.constructor;
                    let key = this.table + "@" + nit.trim (this.owner?.id);
                    let seq = ~~cls.seqMap[key] + 1;

                    cls.seqMap[key] = seq;

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

            Self
                .defineAction ("AlterColumn")
                .sql (`
                    ALTER TABLE @table
                    ALTER COLUMN %{column.name|id} %{action}
                `)
                .field ("<column>", Self.Column.name)
                .field ("<action>", "string")
            ;

            Self
                .defineAction ("AddConstraint")
                .sql (`
                    %{constraint.sql}
                `)
                .field ("<constraint>", Self.Constraint.name)
            ;

            Self
                .defineAction ("DropConstraint")
                .sql (`
                    ALTER TABLE @table
                    DROP CONSTRAINT IF EXISTS %{constraint.dn|id}
                `)
                .field ("<constraint>", Self.Constraint.name)
            ;

            Self
                .defineAction ("AddIndex")
                .sql (`
                    %{index.sql}
                `)
                .field ("<index>", Self.Index.name)
            ;

            Self
                .defineAction ("DropIndex")
                .sql (`
                    DROP INDEX IF EXISTS %{index.dn|id}
                `)
                .field ("<index>", Self.Index.name)
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

        .memo ("id", false, false, function () { return nit.uuid (); })
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
            enumerable: false,
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
            let cls = Self.constraints[nit.pascalCase (name)];
            let constraint = new cls (this.name, ...nit.array (arguments).slice (1));

            constraint.owner = this;
            this.constraints.push (constraint);

            return this;
        })
        .method ("$index", function ()
        {
            this.indexes.push (new Self.Index (this.name, ...arguments));

            return this;
        })
        .method ("create", async function (all)
        {
            await this.db.query (this.createSql);

            if (all)
            {
                await this.createIndexes ();
                await this.createConstraints ();
            }

            return this;
        })
        .method ("createConstraints", async function ()
        {
            for (let c of this.constraints)
            {
                await this.db.query (c.sql);
            }

            return this;
        })
        .method ("createIndexes", async function ()
        {
            for (let i of this.indexes)
            {
                await this.db.query (i.sql);
            }

            return this;
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
        .method ("patch", async function (that, filter)
        {
            let self = this;

            function patcher (action)
            {
                if (!filter || filter (action, self))
                {
                    return self.db.query (action.sql);
                }
            }

            await self.patchColumns (that, patcher);
            await self.patchConstraints (that, patcher);
            await self.patchIndexes (that, patcher);
        })
        .method ("patchColumns", async function (that, patcher)
        {
            let self = this;
            let name = self.name;
            let thisColumnMap = nit.index (this.columns, "name");
            let thatColumnMap = nit.index (that.columns, "name");
            let actions = [];

            nit.each (thatColumnMap, (c, n) =>
            {
                if (!thisColumnMap[n])
                {
                    actions.push (new Self.actions.AddColumn (name, c));
                }
            });

            nit.each (thisColumnMap, (c, n) =>
            {
                if (!thatColumnMap[n])
                {
                    actions.push (new Self.actions.DropColumn (name, c));
                }
            });

            nit.each (thisColumnMap, (oc, n, nc) =>
            {
                if ((nc = thatColumnMap[n]) && nc.sql != oc.sql)
                {
                    if (!nit.is.equal ([nc.type, nc.array], [oc.type, oc.array]))
                    {
                        actions.push (new Self.actions.AlterColumn (name, nc, `TYPE ${nc.type}${nc.array ? '[]' : ''}`));
                    }

                    if (!nit.is.equal (nc.defval, oc.defval))
                    {
                        if (!nit.is.empty (nc.defval))
                        {
                            actions.push (new Self.actions.AlterColumn (name, nc, `SET DEFAULT ${nc.defval}`));
                        }
                        else
                        {
                            actions.push (new Self.actions.AlterColumn (name, nc, `DROP DEFAULT`));
                        }
                    }

                    if (nc.nullable != oc.nullable)
                    {
                        if (nc.nullable)
                        {
                            actions.push (new Self.actions.AlterColumn (name, nc, `DROP NOT NULL`));
                        }
                        else
                        {
                            actions.push (new Self.actions.AlterColumn (name, nc, `SET NOT NULL`));
                        }
                    }
                }
            });

            return await nit.sequential (actions.map (action => patcher.bind (null, action)));
        })
        .method ("patchConstraints", async function (that, patcher)
        {
            let self = this;
            let name = self.name;
            let thisConstraintMap = nit.index (this.constraints, "dn");
            let thatConstraintMap = nit.index (that.constraints, "dn");
            let actions = [];

            nit.each (thatConstraintMap, (c, n) =>
            {
                if (!thisConstraintMap[n])
                {
                    actions.push (new Self.actions.AddConstraint (name, c));
                }
            });

            nit.each (thisConstraintMap, (c, n) =>
            {
                if (!thatConstraintMap[n])
                {
                    actions.push (new Self.actions.DropConstraint (name, c));
                }
            });

            nit.each (thisConstraintMap, (oc, n, nc) =>
            {
                if ((nc = thatConstraintMap[n]) && nc.sql != oc.sql)
                {
                    actions.push (new Self.actions.DropConstraint (name, oc));
                    actions.push (new Self.actions.AddConstraint (name, nc));
                }
            });

            return await nit.sequential (actions.map (action => patcher.bind (null, action)));
        })
        .method ("patchIndexes", async function (that, patcher)
        {
            let self = this;
            let name = self.name;
            let thisIndexMap = nit.index (this.indexes, "dn");
            let thatIndexMap = nit.index (that.indexes, "dn");
            let actions = [];

            nit.each (thatIndexMap, (c, n) =>
            {
                if (!thisIndexMap[n])
                {
                    actions.push (new Self.actions.AddIndex (name, c));
                }
            });

            await nit.each (thisIndexMap, async (c, n) =>
            {
                if (!thatIndexMap[n])
                {
                    actions.push (new Self.actions.DropIndex (name, c));
                }
            });

            await nit.each (thisIndexMap, async (oi, n, ni) =>
            {
                if ((ni = thatIndexMap[n]) && ni.sql != oi.sql)
                {
                    actions.push (new Self.actions.DropIndex (name, oi));
                    actions.push (new Self.actions.AddIndex (name, ni));
                }
            });

            return await nit.sequential (actions.map (action => patcher.bind (null, action)));
        })
    ;
};
