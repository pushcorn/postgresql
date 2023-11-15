module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Query", "postgresql.Clause"))
        .categorize ("postgresql.queries")
        .defineMeta ("mergeableFields...", "string")
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
                .field ("<content>", [Self.Expr.name, Self.superclass.name].join ("|"))
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
                .field ("<query>", [Self.Expr.name, Self.superclass.name].join ("|"))
            ;
        })
        .defineClause ("Column", Column =>
        {
            Column
                .sql (`%{column.sql}%{#+alias} AS %{alias|id}%{/}`)
                .field ("<column>", [Self.Id.name, Self.Expr.name].join ("|"))
                .field ("[alias]", "string")
            ;
        })
        .defineClause ("GroupBy", GroupBy =>
        {
            GroupBy
                .sql (`%{column.sql}`)
                .field ("<column>", [Self.Id.name, Self.Expr.name].join ("|"))
            ;
        })
        .defineClause ("OrderBy", OrderBy =>
        {
            OrderBy
                .sql (`%{column.sql}%{#+order} %{order.toUpperCase ()}%{/}`)
                .field ("<column>", [Self.Id.name, Self.Expr.name].join ("|"))
                .field ("[order]", "string", "The sort order")
                    .constraint ("choice", "ASC", "DESC")
            ;
        })
        .defineClause ("Condition", Condition =>
        {
            Condition
                .sql (`%{left.sql}%{#+op} %{op}%{/}%{#+right} %{right.sql}%{/}`)
                .field ("<left>", [Self.Id.name, Self.Expr.name, Self.Val.name].join ("|"))
                .field ("[right]", [Self.Val.name, Self.Expr.name, Self.Id.name].join ("|"))
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
                .sql (`%{table|id}%{#+alias} %{alias}%{/}`)
                .field ("<source>", "string|postgresql.Table|function")
                    .constraint ("subclass", "postgresql.Model",
                    {
                        condition: "nit.is.func (this.value)"
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
                .field ("<left>", [Self.Id.name, Self.Expr.name, Self.Val.name].join ("|"))
                .field ("<right>", [Self.Id.name, Self.Expr.name, Self.Val.name].join ("|"))
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
        .method ("merge", function (that)
        {
            let cls = this.constructor;
            let mergeableFields = cls.mergeableFields;

            cls.fields
                .filter (f => !mergeableFields.length || mergeableFields.includes (f.name))
                .forEach (f =>
                {
                    let n = f.name;
                    let v = that[n];

                    if (!nit.is.empty (v))
                    {
                        this[n] = f.array ? this[n].concat (v) : v;
                    }
                })
            ;

            return this;
        })
    ;
};
