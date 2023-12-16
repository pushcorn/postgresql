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

        .method ("LeftJoin", function (source, alias) // eslint-disable-line no-unused-vars
        {
            return this.Join (...arguments, { type: "left" });
        })
        .method ("ColumnExpr", function (expr, alias)
        {
            return this.Column (Self.Expr (expr), alias);
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
        .method ("On", function (left, right, op) // eslint-disable-line no-unused-vars
        {
            let { joins } = this;

            if (!joins.length)
            {
                this.throw ("error.no_joins_defined");
            }

            joins[joins.length - 1].ons.push (new Self.JoinCondition (...arguments));

            return this;
        })
        .method ("OnExpr", function (from, to, op)
        {
            return this.On (Self.Expr (from), Self.Val (to), op);
        })
        .method ("With", function ()
        {
            return this.Prepend (new Self.With (...arguments));
        })
    ;
};
