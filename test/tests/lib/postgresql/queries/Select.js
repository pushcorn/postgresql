test.object ("postgresql.queries.Select")
    .should ("represent a SELECT query")
        .after (s =>
        {
            s.result
                .$column ("name")
                .$columnExpr ("AVG (age)", "age")
                .$from ("users", "u")
                .$join ("emails", "e")
                    .$on ("e.user_id", "u.id")
                .$leftJoin ("websites", "w")
                    .$on ("w.user_id", "u.id")
                    .$onExpr ("w.count + 2", 10, ">")
                .$whereExpr ("a > 3")
                .$where ("u.name", "a string")
                .$where ("c", s.class.NULL)
                .$whereRef ("u.status_id", "s.id")
                .$with ("roles", "SELECT * FROM roles")
                .$groupBy ("age")
                .$groupByExpr ("UPPER (name)")
                .$havingExpr ("age > 10")
                .$orderBy ("age")
                .$orderByExpr ("UPPER (name)")
                .$append ("FOR UPDATE")
                .$limit (10)
                .$offset (20)
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


test.method ("postgresql.queries.Select", "$on")
    .should ("throw if no join was added")
        .throws ("error.no_joins_defined")
        .commit ()
;
