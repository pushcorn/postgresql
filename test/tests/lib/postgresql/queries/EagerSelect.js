test.object ("postgresql.queries.EagerSelect")
    .useMockPgClient ()
    .should ("represent an eager-select query")
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
                .Join (s.Tag)
                    .With (query =>
                    {
                        query.WhereExpr ("name ILIKE 'joseph'");
                    })
                    .On ("tag_id", "id")
                .Join (s.User)
                    .On ("owner_id", "id", "t0")
                    .OnExpr ("a + 3", 9)
                .Where ("t0.name", "notebook")
                .WhereRef ("t0.name", "t1.name")
                .WhereExpr ("LENGTH (t0.name) > 20")
                .GroupBy ("t0.name")
                .GroupByExpr ("UPPER (t0.name)")
                .OrderBy ("t0.name", "ASC")
                .OrderByExpr ("UPPER (t1.city)", "DESC")
                .Having ("t0.age", 3, ">")
                .Limit (10)
                .Offset (10)
                .Append ("FOR UPDATE")
                .Prepend ("FOR SELECT")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            FOR SELECT
            WITH t0 AS
            (
              SELECT *
              FROM "test_products"
              WHERE "id" = '4'
              LIMIT 1
            )
            , t2 AS
            (
              SELECT *
              FROM "test_tags"
              WHERE name ILIKE 'joseph'
            )

            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name",
              t0."owner_id" AS "t0_owner_id"
              ,
              t1."product_id" AS "t1_product_id",
              t1."tag_id" AS "t1_tag_id"
              ,
              t2."id" AS "t2_id",
              t2."name" AS "t2_name"
              ,
              t3."id" AS "t3_id",
              t3."name" AS "t3_name"

            FROM t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
              LEFT JOIN t2 ON t2."id" = t1."tag_id"
              LEFT JOIN "test_users" t3 ON t3."id" = t0."owner_id" AND '9' = a + 3

            WHERE t0."name" = 'notebook' AND t0."name" = t1."name" AND LENGTH (t0.name) > 20
            GROUP BY t0."name", UPPER (t0.name)
            HAVING t0."age" > '3'
            ORDER BY t0."name" ASC, UPPER (t1.city) DESC
            LIMIT 10
            OFFSET 10
            FOR UPDATE
        `)
        .commit ()

    .reset ()
        .after (s =>
        {
            s.result
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
                .HavingExpr ("t0.age > 3")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH t0 AS
            (
              SELECT *
              FROM "test_products"
              WHERE "id" = '4'
              LIMIT 1
            )

            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name",
              t0."owner_id" AS "t0_owner_id"
              ,
              t1."product_id" AS "t1_product_id",
              t1."tag_id" AS "t1_tag_id"

            FROM t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"

            HAVING t0.age > 3
        `)
        .commit ()

    .reset ()
        .after (s =>
        {
            s.result
                .Column ("t0.id")
                .Column ("t0.name", "nn")
                .Column ("t1.owner_id", "user_id")
                .ColumnExpr ("AVG (age)", "age")
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
                .HavingExpr ("t0.age > 3")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH t0 AS
            (
              SELECT *
              FROM "test_products"
              WHERE "id" = '4'
              LIMIT 1
            )

            SELECT
              t0."id",
              t0."name" AS "nn",
              t1."owner_id" AS "user_id",
              AVG (age) AS "age"

            FROM t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"

            HAVING t0.age > 3
        `)
        .commit ()

    .should ("throw if the 'on' method is called when less than 2 tables were defined")
        .after (s =>
        {
            s.result
                .Table (s.Product.table)
                    .With (query =>
                    {
                        query
                            .Where ("id", 4)
                            .Limit (1)
                        ;
                    })
            ;
        })
        .expectingMethodToThrow ("result.On", ["id", "product_id"], "error.two_tables_required")
        .commit ()

    .should ("throw if the 'with' method is called when no tables were defined")
        .expectingMethodToThrow ("result.With", null, "error.no_table_added")
        .commit ()
;
