test.object ("postgresql.queries.Insert")
    .useMockPgClient ()
    .should ("represent an INSERT query")
        .after (s =>
        {
            s.result
                .Table ("users")
                .ConflictBy ("name", "John Doe")
                .Value ("age", 3)
                .ValueExpr ("date", "NOW ()")
                .ValueAny ("arr", [1, 2])
                .ValueAny ("obj", { a: 3 })
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            INSERT INTO "users" ("name", "age", "date", "arr", "obj")
            VALUES ('John Doe', '3', NOW (), '{"1","2"}', '{"a":3}')
            ON CONFLICT ("name")
            DO UPDATE
              SET "age" = EXCLUDED."age", "date" = EXCLUDED."date", "arr" = EXCLUDED."arr", "obj" = EXCLUDED."obj"
        `)
        .commit ()

    .reset ()
        .after (s =>
        {
            s.result
                .Table ("users")
                .Column ("name")
                .Column ("age")
                .Query (nit.new ("postgresql.queries.Select")
                    .From ("tmp")
                    .Limit (10)
                )
                .Append ("RETURNING *")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH t AS
            (
              SELECT *
              FROM "tmp"
              LIMIT 10
            )
            INSERT INTO "users" ("name", "age")
            SELECT *
            FROM t
            RETURNING *
        `)
        .commit ()

    .reset ()
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
            ;
        })
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag")
                .field ("owner", "test.models.User")
            ;
        })
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("products...", "test.models.Product")
            ;
        })
        .after (s =>
        {
            s.result
                .Table ("users")
                .Column ("name")
                .Column ("age")
                .Query (nit.new ("postgresql.queries.EagerSelect")
                    .Column ("t0.name")
                    .Column ("t1.age")
                    .From (s.Product)
                        .With (query =>
                        {
                            query
                                .Where ("id", 4)
                                .Limit (1)
                            ;
                        })
                    .Join (s.Product.fieldMap.tags.relationship.joinModelClass)
                        .On ("id", "product_id")
                )
                .Append ("RETURNING *")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH t AS
            (
              WITH t0 AS
              (
                SELECT *
                FROM "test_products"
                WHERE "id" = '4'
                LIMIT 1
              )

              SELECT
                t0."name",
                t1."age"

              FROM t0
                LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
            )
            INSERT INTO "users" ("name", "age")
            SELECT *
            FROM t
            RETURNING *
        `)
        .commit ()
;
