const { Expr, Id, Val, JoinCondition, NULL } = nit.require ("postgresql.Query");


test.object ("postgresql.Query.Expr", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|formatArgs})")
        .given ("u.name = 3")
        .returns (`u.name = 3`)
        .commit ()
;


test.object ("postgresql.Query.Val", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|formatArgs})")
        .given (3)
        .returns (`'3'`)
        .commit ()

    .given (null)
    .given ()
        .returns ("NULL")
        .commit ()
;


test.object ("postgresql.Query.Fragment", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|formatArgs})")
        .given (3)
        .returns (`3`)
        .commit ()

    .given ("a + 3")
        .returns (`a + 3`)
        .commit ()

    .given (Id ("u.name"))
        .returns (`u."name"`)
        .commit ()
;


test.object ("postgresql.Query.With", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|format})")
        .given ("users", "SELECT * FROM users LIMIT 1")
        .returns (nit.trim.text`
            WITH "users" AS
            (
              SELECT * FROM users LIMIT 1
            )
        `)
        .commit ()

    .given ("users", nit.new ("postgresql.queries.Select").From ("users").Limit (1))
        .returns (nit.trim.text`
            WITH "users" AS
            (
              SELECT *
              FROM "users"
              LIMIT 1
            )
        `)
        .commit ()
;


test.object ("postgresql.Query.GroupBy", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|format})")
        .given ("u.name")
        .returns (`u."name"`)
        .commit ()

    .given (Id ("u.age"))
        .returns (`u."age"`)
        .commit ()

    .given (Expr ("UPPER (u.name)"))
        .returns (`UPPER (u.name)`)
        .commit ()
;

test.object ("postgresql.Query.OrderBy", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|format})")
        .given ("u.name")
        .returns (`u."name"`)
        .commit ()

    .given (Id ("u.age"))
        .returns (`u."age"`)
        .commit ()

    .given (Expr ("UPPER (u.name)"), "DESC")
        .returns (`UPPER (u.name) DESC`)
        .commit ()
;


test.object ("postgresql.Query.Condition", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|formatArgs})")
        .given ("u.name", 3)
        .returns (`u."name" = '3'`)
        .commit ()

    .given (Expr ("u.age > 10"))
        .returns (`u.age > 10`)
        .commit ()

    .given ("u.name", Id ("p.name"))
        .returns (`u."name" = p."name"`)
        .commit ()

    .given (Id ("u.name"), Id ("p.name"))
        .returns (`u."name" = p."name"`)
        .commit ()

    .given ("u.age", Expr ("p.avg + 10"))
        .returns (`u."age" = p.avg + 10`)
        .commit ()

    .given (Val (3), Id ("p.name"))
        .returns (`'3' = p."name"`)
        .commit ()

    .given (NULL, Id ("p.name"))
        .returns (`NULL IS p."name"`)
        .commit ()

    .given (Id ("p.name"), NULL)
        .returns (`p."name" IS NULL`)
        .commit ()
;


test.object ("postgresql.Query.From", { property: "sql" })
    .useMockPgClient ()
    .should ("render the sql to `%{result}` when the input is ([Function: test.models.User], \"u\")")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .up (s => s.User = s.db.lookup ("test.models.User"))
        .up (s => s.args = [s.User, "u"])
        .returns (`"test_users" u`)
        .commit ()

    .should ("render the sql to `%{result}` when the input is (postgresql.Table {}, \"uu\")")
        .up (s => s.User = s.db.lookup ("test.models.User"))
        .up (s => s.args = [s.User.table, "uu"])
        .returns (`"test_users" uu`)
        .commit ()

    .should ("render the sql to `%{result}` when the input is (%{args|formatArgs})")
        .given ("users", "u1")
        .returns (`"users" u1`)
        .commit ()
;


test.object ("postgresql.Query.JoinCondition", { property: "sql" })
    .should ("render the sql to `%{result}` when the input is (%{args|formatArgs})")
        .given ("u.name", "a.name")
        .returns (`u."name" = a."name"`)
        .commit ()

    .given ("u.name", Id ("p.name"))
        .returns (`u."name" = p."name"`)
        .commit ()

    .given (Id ("u.name"), Id ("p.name"))
        .returns (`u."name" = p."name"`)
        .commit ()

    .given ("u.age", Expr ("p.avg + 10"))
        .returns (`u."age" = p.avg + 10`)
        .commit ()

    .given (Val (3), Id ("p.name"))
        .returns (`'3' = p."name"`)
        .commit ()

    .given (NULL, Id ("p.name"))
        .returns (`NULL IS p."name"`)
        .commit ()

    .given (Id ("p.name"), NULL)
        .returns (`p."name" IS NULL`)
        .commit ()
;


test.object ("postgresql.Query.Join", { property: "sql" })
    .useMockPgClient ()
    .should ("render the sql to `%{result}` when the input is ([Function: test.models.User], \"u\")")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .up (s => s.User = s.db.lookup ("test.models.User"))
        .up (s => s.args = [s.User, "u", { ons: JoinCondition ("u.name", "p.name") }])
        .returns (`JOIN "test_users" u ON u."name" = p."name"`)
        .commit ()

    .should ("render the sql to `%{result}` when the input is (postgresql.Table {}, \"uu\")")
        .up (s => s.User = s.db.lookup ("test.models.User"))
        .up (s => s.args = [s.User.table, "uu", { ons: JoinCondition ("uu.name", "p.name"), type: "left" }])
        .returns (`LEFT JOIN "test_users" uu ON uu."name" = p."name"`)
        .commit ()

    .should ("render the sql to `%{result}` when the input is (postgresql.Table {}, \"uu\")")
        .up (s => s.args =
        [
            s.User.table,
            "uu",
            {
                type: "right",
                ons:
                [
                    JoinCondition ("uu.name", "p.name"),
                    JoinCondition ("uu.age", Val (3))
                ]
            }
        ])
        .returns (`RIGHT JOIN "test_users" uu ON uu."name" = p."name" AND uu."age" = '3'`)
        .commit ()
;


test.method ("postgresql.Query", "merge")
    .should ("merge the values from another query")
        .before (s => s.object = nit.new ("postgresql.queries.Select")
            .From ("users")
        )
        .given (nit.new ("postgresql.queries.Select")
            .Limit (10)
            .Where ("name", "John")
        )
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "name" = 'John'
            LIMIT 10
        `)
        .commit ()
;
