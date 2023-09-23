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

        .method ("$setExpr", function (column, expr)
        {
            return this.$set (column, Self.Expr (expr));
        })
        .method ("$setAny", function (column, value)
        {
            return this.$set (column, Self.Val ({ value }));
        })
        .method ("$whereExpr", function (expr)
        {
            return this.$where (Self.Expr (expr));
        })
        .method ("$whereRef", function (left, right, op)
        {
            return this.$where (Self.Id (left), Self.Id (right), op);
        })
    ;
};
