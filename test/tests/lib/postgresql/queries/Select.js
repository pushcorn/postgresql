test.object ("postgresql.queries.Select")
    .should ("represent a SELECT query")
        .after (s =>
        {
            s.result
                .Column ("name")
                .ColumnExpr ("AVG (age)", "age")
                .From ("users", "u")
                .Join ("emails", "e")
                    .On ("e.user_id", "u.id")
                .LeftJoin ("websites", "w")
                    .On ("w.user_id", "u.id")
                    .OnExpr ("w.count + 2", 10, ">")
                .WhereExpr ("a > 3")
                .Where ("u.name", "a string")
                .Where ("c", s.class.NULL)
                .WhereRef ("u.status_id", "s.id")
                .With ("roles", "SELECT * FROM roles")
                .GroupBy ("age")
                .GroupByExpr ("UPPER (name)")
                .HavingExpr ("age > 10")
                .OrderBy ("age")
                .OrderByExpr ("UPPER (name)")
                .Append ("FOR UPDATE")
                .Limit (10)
                .Offset (20)
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH "roles" AS
            (
              SELECT * FROM roles
            )
            SELECT
              "name",
              AVG (age) AS "age"

            FROM "users" u
              JOIN "emails" e ON e."user_id" = u."id"
              LEFT JOIN "websites" w ON w."user_id" = u."id" AND w.count + 2 > '10'
            WHERE a > 3 AND u."name" = 'a string' AND "c" IS NULL AND u."status_id" = s."id"
            GROUP BY "age", UPPER (name)
            HAVING age > 10
            ORDER BY "age", UPPER (name)
            LIMIT 10
            OFFSET 20
            FOR UPDATE
        `)
        .commit ()
;


test.method ("postgresql.queries.Select", "On")
    .should ("throw if no join was added")
        .throws ("error.no_joins_defined")
        .commit ()
;
