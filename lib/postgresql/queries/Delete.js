module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineQuery ("Delete"))
        .sql (`
            %{#prepends}
            %{sql}%{/}
            DELETE FROM %{table.sql}
            %{#+usings}USING%{#usings}%{$FIRST ? '' : ','} %{sql}%{/}
            %{/}%{#+wheres}WHERE%{#wheres}%{$FIRST ? '' : ' AND'} %{sql}%{/}
            %{/}%{#appends}%{sql}
            %{/}
        `)
        .field ("prepends...", Self.Fragment.name)
        .field ("table", Self.From.name)
        .field ("usings...", Self.From.name)
        .field ("wheres...", Self.Condition.name)
        .field ("appends...", Self.Fragment.name)

        .method ("WhereExpr", function (expr)
        {
            return this.Where (Self.Expr (expr));
        })
        .method ("With", function ()
        {
            return this.Prepend (new Self.With (...arguments));
        })
    ;
};
