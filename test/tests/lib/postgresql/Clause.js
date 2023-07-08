test.method ("postgresql.Clause", "sql", true)
    .should ("set the constant SQL to the provided template")
    .given ("SELECT * FROM %{table}")
    .before (s => s.class = s.class.defineSubclass ("Test", true))
    .expectingPropertyToBe ("class.SQL", "SELECT * FROM %{table}")
    .commit ()
;


test.custom ("Method: postgresql.Clause.render ()")
    .should ("use postgresql.format () to render the template")
    .task (() =>
    {
        const Test = nit.defineClass ("Test", "postgresql.Clause")
            .sql ("SELECT * FROM %{table|id}")
            .field ("<table>", "string")
        ;

        return new Test ("users").sql;
    })
    .returns (`SELECT * FROM "users"`)
    .commit ()
;


test.method ("postgresql.Clause", "defineClause", true)
    .should ("define an inner clause")
    .given ("Fragement")
    .returns (nit.require ("postgresql.Clause"))
    .expectingPropertyToBe ("class.Fragement.superclass", nit.require ("postgresql.Clause"))
    .commit ()
;
