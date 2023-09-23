module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineQuery ("Insert"))
        .defineClause ("Value", Value =>
        {
            Value
                .field ("<column>", "string")
                .field ("<value>", [Self.Val.name, Self.Expr.name].join ("|"))
            ;
        })
        .sql (`
            %{#prepends}
            %{sql}%{/}%{#+query}
            WITH t AS
            (
            %{query.sql|nit.indent ('  ', true)}
            )%{/}
            INSERT INTO %{table.sql} (%{#+columns}%{#columns}%{$FIRST ? '' : ', '}%{.|id}%{/}%{:}%{#values}%{$FIRST ? '' : ', '}%{column|id}%{/}%{/})%{#+values}
            VALUES (%{#values}%{$FIRST ? '' : ', '}%{value.sql}%{/})%{/}%{#+query}
            SELECT *
            FROM t%{/}%{#+conflicts}
            ON CONFLICT (%{#conflicts}%{$FIRST ? '' : ', '}%{.|id}%{/})
            DO UPDATE
              SET %{#nonConflicts}%{$FIRST ? '' : ', '}%{.|id} = EXCLUDED.%{.|id}%{/}%{/}%{#appends}
            %{sql}%{/}
        `)
        .field ("prepends...", Self.Fragment.name)
        .field ("table", Self.From.name)
        .field ("columns...", "string")
        .field ("values...", Self.Value.name)
        .field ("query", "postgresql.queries.Select|postgresql.queries.EagerSelect")
        .field ("conflicts...", "string")
        .field ("appends...", Self.Fragment.name)

        .getter ("nonConflicts", function ()
        {
            return (nit.is.empty (this.columns) ? this.values.map (v => v.column) : this.columns)
                .filter (c => !this.conflicts.includes (c))
            ;
        })
        .method ("$conflictBy", function (column, value) // eslint-disable-line no-unused-vars
        {
            return this.$value (...arguments)
                .$conflict (column)
            ;
        })
        .method ("$valueExpr", function (column, expr)
        {
            return this.$value (column, Self.Expr (expr));
        })
        .method ("$valueAny", function (column, value)
        {
            return this.$value (column, Self.Val ({ value }));
        })
    ;
};
