test.object ("postgresql.queries.Delete")
    .should ("represent a DELETE query")
        .after (({ result: query }) =>
        {
            const { NULL } = query.constructor;

            query
                .$table ("users", "u")
                .$using ("roles", "r")
                .$where ("id", 3, ">")
                .$where ("u.name", "a string")
                .$where ("c", NULL)
                .$whereExpr ("r.name = u.role")
                .$with ("roles", "SELECT * FROM roles WHERE name = 'manager'")
                .$append ("RETURNING *")
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
