module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineQuery ("Select"))
        .m ("error.no_joins_defined", "No joins were defined.")
        .meta ("mergeableFields", ["wheres", "groupBys", "having", "orderBys", "limit", "offset", "appends"])
        .sql (`
            %{#prepends}
            %{sql}%{/}
            SELECT%{#-columns} *%{:}%{#columns}
              %{sql}%{$LAST ? '' : ','}%{/}
            %{/}
            FROM%{#froms}%{$FIRST ? '' : ','} %{sql}%{/}%{#joins}
              %{sql}%{/}
            %{#+wheres}WHERE%{#wheres}%{$FIRST ? '' : ' AND'} %{sql}%{/}
            %{/}%{#+groupBys}GROUP BY%{#groupBys}%{$FIRST ? '' : ','} %{sql}%{/}
            %{/}%{#+having}HAVING %{having.sql}
            %{/}%{#+orderBys}ORDER BY%{#orderBys}%{$FIRST ? '' : ','} %{sql}%{/}
            %{/}%{#+limit}LIMIT %{limit}
            %{/}%{#+offset}OFFSET %{offset}
            %{/}%{#appends}%{sql}
            %{/}
        `)
        .field ("prepends...", Self.Fragment.name)
        .field ("columns...", Self.Column.name)
        .field ("froms...", Self.From.name)
        .field ("joins...", Self.Join.name)
        .field ("wheres...", Self.Condition.name)
        .field ("groupBys...", Self.GroupBy.name)
        .field ("having", Self.Condition.name)
        .field ("orderBys...", Self.OrderBy.name)
        .field ("limit", "integer?")
        .field ("offset", "integer?")
        .field ("appends...", Self.Fragment.name)

        .method ("$leftJoin", function (source, alias) // eslint-disable-line no-unused-vars
        {
            return this.$join (...arguments, { type: "left" });
        })
        .method ("$columnExpr", function (expr, alias)
        {
            return this.$column (Self.Expr (expr), alias);
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
        .method ("$on", function (left, right, op) // eslint-disable-line no-unused-vars
        {
            let { joins } = this;

            if (!joins.length)
            {
                this.throw ("error.no_joins_defined");
            }

            joins[joins.length - 1].ons.push (new Self.JoinCondition (...arguments));

            return this;
        })
        .method ("$onExpr", function (from, to, op)
        {
            return this.$on (Self.Expr (from), Self.Val (to), op);
        })
        .method ("$with", function ()
        {
            return this.$prepend (new Self.With (...arguments));
        })
    ;
};
