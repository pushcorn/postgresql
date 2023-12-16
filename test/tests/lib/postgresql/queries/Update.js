test.object ("postgresql.queries.Update")
    .should ("represent an UPDATE query")
        .after (s =>
        {
            s.result
                .Table ("users", "u")
                .Set ("name", "John Doe")
                .Set ("age", 3)
                .SetAny ("note", "")
                .SetExpr ("count", "count + 1")
                .From ("status", "s")
                .Where ("role", "manager")
                .WhereRef ("s.id", "u.status_id")
                .WhereExpr ("creationTime < '2000'")
                .Prepend ("WITH ()")
                .Append ("RETURNING *")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH ()
            UPDATE "users" u
            SET "name" = 'John Doe', "age" = '3', "note" = '', "count" = count + 1
            FROM "status" s
            WHERE "role" = 'manager' AND s."id" = u."status_id" AND creationTime < '2000'
            RETURNING *
        `)
        .commit ()
;
