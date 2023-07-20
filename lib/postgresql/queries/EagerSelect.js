module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineQuery ("EagerSelect"))
        .m ("error.two_tables_required", "More than two tables required to add join conditions.")
        .m ("error.no_table_added", "No table was added.")
        .use ("postgresql.queries.Select")

        .defineClause ("Table", Table =>
        {
            Table
                .field ("<source>", "any")
                    .constraint ("type", "postgresql.Table", "function")
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
            %{#tables}%{#+with}WITH %{alias} AS
            (
            %{with.sql|nit.indent ('  ', true)}
            )
            %{/}%{/}
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

        .method ("$from", function ()
        {
            const { tables } = this.$table (...arguments);

            let table = tables.slice (-1)[0];

            table.alias = table.alias || "t" + (tables.length - 1);

            return this;
        })
        .method ("$columnExpr", function (expr, alias)
        {
            return this.$column (Self.Expr (expr), alias);
        })
        .method ("$join", function ()
        {
            return this.$from (...arguments);
        })
        .method ("$on", function (from, to, fromAlias)
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
        .method ("$onExpr", function (from, to, fromAlias) // eslint-disable-line no-unused-vars
        {
            return this.$on (Self.Expr (from), Self.Val (to));
        })
        .method ("$whereExpr", function (expr)
        {
            return this.$where (Self.Expr (expr));
        })
        .method ("$whereRef", function (left, right, op)
        {
            return this.$where (Self.Id (left), Self.Id (right), op);
        })
        .method ("$groupByExpr", function (expr)
        {
            return this.$groupBy (Self.Expr (expr));
        })
        .method ("$orderByExpr", function (expr, order)
        {
            return this.$orderBy (Self.Expr (expr), order);
        })
        .method ("$havingExpr", function (expr)
        {
            return this.$having (Self.Expr (expr));
        })
        .method ("$with", function (builder)
        {
            let { tables } = this;

            if (!tables.length)
            {
                this.throw ("error.no_table_added");
            }

            let table = tables.slice (-1)[0];
            let query = table.with = new Self.Select;

            builder.call (this, query.$from (table.table));

            return this;
        })
    ;
};