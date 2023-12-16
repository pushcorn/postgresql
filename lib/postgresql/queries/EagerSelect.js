module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineQuery ("EagerSelect"))
        .m ("error.two_tables_required", "More than two tables required to add join conditions.")
        .m ("error.no_table_added", "No table was added.")
        .use ("postgresql.queries.Select")

        .defineClause ("Table", Table =>
        {
            Table
                .field ("<source>", "function|postgresql.Table")
                    .constraint ("subclass", "postgresql.Model",
                    {
                        condition: "nit.is.func (this.value)"
                    })
                .field ("[alias]", "string", "The table alias.")
                .field ("ons...", Self.JoinCondition.name)
                .field ("with", Self.Select.name)

                .getter ("table", function ()
                {
                    let { source } = this;

                    return nit.is.func (source) ? source.table : source;
                })
            ;
        })
        .sql (`
            %{#prepends}
            %{sql}%{/}
            %{#withs}%{$FIRST ? 'WITH' : ','} %{alias} AS
            (
            %{with.sql|nit.indent ('  ', true)}
            )
            %{/}
            SELECT%{#+columns}%{#columns}
              %{sql}%{$LAST ? '' : ','}%{/}

            %{:}%{#tables}%{#table.columns}
              %{$DATA.alias}.%{name|id} AS %{$DATA.alias + '_' + name|id}%{$LAST ? '' : ','}%{/}
            %{$LAST ? '' : '  ,'}%{/}
            %{/}%{#tables}%{$FIRST ? 'FROM ' : '  LEFT JOIN '}%{#-with}%{table.name|id} %{/}%{alias}%{#+ons} ON %{#ons}%{$FIRST ? '' : ' AND '}%{sql}%{/}%{/}
            %{/}
            %{#+wheres}WHERE%{#wheres}%{$FIRST ? '' : ' AND'} %{sql}%{/}
            %{/}%{#+groupBys}GROUP BY%{#groupBys}%{$FIRST ? '' : ','} %{sql}%{/}
            %{/}%{#+having}HAVING %{having.sql}
            %{/}%{#+orderBys}ORDER BY%{#orderBys}%{$FIRST ? '' : ','} %{sql}%{/}
            %{/}%{#+limit}LIMIT %{limit}
            %{/}%{#+offset}OFFSET %{offset}
            %{/}%{#appends}%{sql}
            %{/}
        `)
        .field ("tables...", Self.Table.name)
        .field ("columns...", Self.Column.name)
        .field ("prepends...", Self.Fragment.name)
        .field ("wheres...", Self.Condition.name)
        .field ("groupBys...", Self.GroupBy.name)
        .field ("having", Self.Condition.name)
        .field ("orderBys...", Self.OrderBy.name)
        .field ("limit", "integer?")
        .field ("offset", "integer?")
        .field ("appends...", Self.Fragment.name)
        .getter ("withs", function ()
        {
            return this.tables
                .filter (t => t.with)
                .map (t => ({ alias: t.alias, with: t.with }))
            ;
        })

        .method ("From", function ()
        {
            const { tables } = this.Table (...arguments);

            let table = tables.slice (-1)[0];

            table.alias = table.alias || "t" + (tables.length - 1);

            return this;
        })
        .method ("ColumnExpr", function (expr, alias)
        {
            return this.Column (Self.Expr (expr), alias);
        })
        .method ("Join", function ()
        {
            return this.From (...arguments);
        })
        .method ("On", function (from, to, fromAlias)
        {
            let { tables } = this;

            if (tables.length < 2)
            {
                this.throw ("error.two_tables_required");
            }

            let [fromTable, toTable] = tables.slice (-2);
            let condition = new Self.JoinCondition (
                nit.is.str (to) ? Self.Id (toTable.alias + "." + to) : to,
                nit.is.str (from) ? Self.Id ((fromAlias || fromTable.alias) + "." + from) : from
            );

            toTable.ons.push (condition);

            return this;
        })
        .method ("OnExpr", function (from, to, fromAlias) // eslint-disable-line no-unused-vars
        {
            return this.On (Self.Expr (from), Self.Val (to));
        })
        .method ("WhereExpr", function (expr)
        {
            return this.Where (Self.Expr (expr));
        })
        .method ("WhereRef", function (left, right, op)
        {
            return this.Where (Self.Id (left), Self.Id (right), op);
        })
        .method ("GroupByExpr", function (expr)
        {
            return this.GroupBy (Self.Expr (expr));
        })
        .method ("OrderByExpr", function (expr, order)
        {
            return this.OrderBy (Self.Expr (expr), order);
        })
        .method ("HavingExpr", function (expr)
        {
            return this.Having (Self.Expr (expr));
        })
        .method ("With", function (builder)
        {
            let { tables } = this;

            if (!tables.length)
            {
                this.throw ("error.no_table_added");
            }

            let table = tables.slice (-1)[0];
            let query = table.with = new Self.Select;

            builder.call (this, query.From (table.table));

            return this;
        })
    ;
};
