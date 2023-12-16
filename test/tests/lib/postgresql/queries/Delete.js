test.object ("postgresql.queries.Delete")
    .should ("represent a DELETE query")
        .after (({ result: query }) =>
        {
            const { NULL } = query.constructor;

            query
                .Table ("users", "u")
                .Using ("roles", "r")
                .Where ("id", 3, ">")
                .Where ("u.name", "a string")
                .Where ("c", NULL)
                .WhereExpr ("r.name = u.role")
                .With ("roles", "SELECT * FROM roles WHERE name = 'manager'")
                .Append ("RETURNING *")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH "roles" AS
            (
              SELECT * FROM roles WHERE name = 'manager'
            )
            DELETE FROM "users" u
            USING "roles" r
            WHERE "id" > '3' AND u."name" = 'a string' AND "c" IS NULL AND r.name = u.role
            RETURNING *
        `)
        .commit ()
;
