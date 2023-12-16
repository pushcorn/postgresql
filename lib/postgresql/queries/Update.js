module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineQuery ("Update"))
        .defineClause ("Set", Set =>
        {
            Set
                .sql (`%{column|id} = %{value.sql}`)
                .field ("<column>", "string")
                .field ("[value]", [Self.Val.name, Self.Expr.name].join ("|"))
            ;
        })
        .sql (`
            %{#prepends}
            %{sql}%{/}
            UPDATE %{table.sql}
            SET %{#sets}%{$FIRST ? '' : ', '}%{sql}%{/}
            %{#+froms}FROM%{#froms}%{$FIRST ? '' : ','} %{sql}%{/}
            %{/}%{#+wheres}WHERE%{#wheres}%{$FIRST ? '' : ' AND'} %{sql}%{/}
            %{/}%{#appends}%{sql}
            %{/}
        `)
        .field ("prepends...", Self.Fragment.name)
        .field ("table", Self.From.name)
        .field ("sets...", Self.Set.name)
        .field ("froms...", Self.From.name)
        .field ("wheres...", Self.Condition.name)
        .field ("appends...", Self.Fragment.name)

        .method ("SetExpr", function (column, expr)
        {
            return this.Set (column, Self.Expr (expr));
        })
        .method ("SetAny", function (column, value)
        {
            return this.Set (column, Self.Val ({ value }));
        })
        .method ("WhereExpr", function (expr)
        {
            return this.Where (Self.Expr (expr));
        })
        .method ("WhereRef", function (left, right, op)
        {
            return this.Where (Self.Id (left), Self.Id (right), op);
        })
    ;
};
