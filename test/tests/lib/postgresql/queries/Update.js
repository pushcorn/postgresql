test.object ("postgresql.queries.Update")
    .should ("represent an UPDATE query")
        .after (s =>
        {
            s.result
                .$table ("users", "u")
                .$set ("name", "John Doe")
                .$set ("age", 3)
                .$setAny ("note", "")
                .$setExpr ("count", "count + 1")
                .$from ("status", "s")
                .$where ("role", "manager")
                .$whereRef ("s.id", "u.status_id")
                .$whereExpr ("creationTime < '2000'")
                .$prepend ("WITH ()")
                .$append ("RETURNING *")
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
