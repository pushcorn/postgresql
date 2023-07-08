module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Query", "postgresql.Clause"))
        .categorize ("postgresql.queries")
        .staticMemo ("NULL", () => nit.freeze (new Self.Val))

        .defineClause ("Expr", Expr =>
        {
            Expr
                .sql (`%{expr}`)
                .field ("<expr>", "string")
            ;
        })
        .defineClause ("Id", Id =>
        {
            Id
                .sql (`%{id|id}`)
                .field ("<id>", "string")
            ;
        })
        .defineClause ("Val", Val =>
        {
            Val
                .sql (`%{value|literal}`)
                .field ("[value]", "any")
            ;
        })
        .defineClause ("Fragment", Fragment =>
        {
            Fragment
                .sql (`%{content.sql}`)
                .field ("<content>", "any")
                    .constraint ("type", Self.Expr.name, Self.superclass.name)
            ;
        })
        .defineClause ("With", With =>
        {
            With
                .sql (`
                    WITH %{name.sql} AS
                    (
                    %{query.sql|nit.indent ('  ', true)}
                    )
                `)
                .field ("<name>", Self.Id.name)
                .field ("<query>", "any")
                    .constraint ("type", Self.Expr.name, Self.superclass.name)
            ;
        })
        .defineClause ("Column", Column =>
        {
            Column
                .sql (`%{column.sql}%{#+alias} AS %{alias|id}%{/}`)
                .field ("<column>", "any")
                    .constraint ("type", Self.Id.name, Self.Expr.name)
                .field ("[alias]", "string")
            ;
        })
        .defineClause ("GroupBy", GroupBy =>
        {
            GroupBy
                .sql (`%{column.sql}`)
                .field ("<column>", "any")
                    .constraint ("type", Self.Id.name, Self.Expr.name)
            ;
        })
        .defineClause ("OrderBy", OrderBy =>
        {
            OrderBy
                .sql (`%{column.sql}%{#+order} %{order.toUpperCase ()}%{/}`)
                .field ("<column>", "any")
                    .constraint ("type", Self.Id.name, Self.Expr.name)
                .field ("[order]", "string", "The sort order")
                    .constraint ("choice", "ASC", "DESC")
            ;
        })
        .defineClause ("Condition", Condition =>
        {
            Condition
                .sql (`%{left.sql}%{#+op} %{op}%{/}%{#+right} %{right.sql}%{/}`)
                .field ("<left>", "any")
                    .constraint ("type", Self.Id.name, Self.Expr.name, Self.Val.name)
                .field ("[right]", "any")
                    .constraint ("type", Self.Val.name, Self.Expr.name, Self.Id.name)
                .field ("[operator]", "string")
                .getter ("op", function ()
                {
                    if (this.right)
                    {
                        return this.operator || (this.left.sql == "NULL" || this.right?.sql == "NULL" ? "IS" : "=");
                    }
                })
            ;
        })
        .defineClause ("From", From =>
        {
            From
                .sql (`%{table|id} %{alias}`)
                .field ("<source>", "any")
                    .constraint ("type", "string", "postgresql.Table", "function")
                    .constraint ("subclass", "postgresql.Model",
                    {
                        when: ctx => nit.is.func (ctx.value)
                    })
                .field ("[alias]", "string")

                .getter ("table", function ()
                {
                    let { source } = this;

                    return nit.is.func (source) ? source.tableName : (source instanceof postgresql.Table ? source.name : source);
                })
            ;
        })
        .defineClause ("JoinCondition", JoinCondition =>
        {
            JoinCondition
                .sql (`%{left.sql} %{op} %{right.sql}`)
                .field ("<left>", "any")
                    .constraint ("type", Self.Id.name, Self.Expr.name, Self.Val.name)
                .field ("<right>", "any")
                    .constraint ("type", Self.Id.name, Self.Expr.name, Self.Val.name)
                .field ("[operator]", "string")
                .getter ("op", function ()
                {
                    return this.operator || (this.left.sql == "NULL" || this.right.sql == "NULL" ? "IS" : "=");
                })
            ;
        })
        .defineClause ("Join", Self.From.name, Join =>
        {
            Join
                .sql (`%{#+type}%{type.toUpperCase ()} %{/}JOIN %{table|id}%{#+alias} %{alias}%{/}%{#+ons} ON %{#ons}%{$FIRST ? '' : ' AND '}%{sql}%{/}`)
                .field ("[ons...]", Self.JoinCondition.name)
                .field ("type", "string")
            ;
        })
    ;
};
