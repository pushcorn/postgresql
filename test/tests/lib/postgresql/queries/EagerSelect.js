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
                .$from (s.Product)
                    .$with (query =>
                    {
                        query
                            .$where ("id", 4)
                            .$limit (1)
                        ;
                    })
                .$join (s.Product.fieldMap.tags.relationship.joinModelClass)
                    .$on ("id", "product_id")
                .$join (s.Tag)
                    .$with (query =>
                    {
                        query.$whereExpr ("name ILIKE 'joseph'");
                    })
                    .$on ("tag_id", "id")
                .$join (s.User)
                    .$on ("owner_id", "id", "t0")
                    .$onExpr ("a + 3", 9)
                .$where ("t0.name", "notebook")
                .$whereRef ("t0.name", "t1.name")
                .$whereExpr ("LENGTH (t0.name) > 20")
                .$groupBy ("t0.name")
                .$groupByExpr ("UPPER (t0.name)")
                .$orderBy ("t0.name", "ASC")
                .$orderByExpr ("UPPER (t1.city)", "DESC")
                .$having ("t0.age", 3, ">")
                .$limit (10)
                .$offset (10)
                .$append ("FOR UPDATE")
                .$prepend ("FOR SELECT")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            FOR SELECT
            WITH t0 AS
            (
              SELECT *
              FROM "products"
              WHERE "id" = '4'
              LIMIT 1
            )
            , t2 AS
            (
              SELECT *
              FROM "tags"
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
              LEFT JOIN "productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
              LEFT JOIN t2 ON t2."id" = t1."tag_id"
              LEFT JOIN "users" t3 ON t3."id" = t0."owner_id" AND '9' = a + 3

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
                .$from (s.Product)
                    .$with (query =>
                    {
                        query
                            .$where ("id", 4)
                            .$limit (1)
                        ;
                    })
                .$join (s.Product.fieldMap.tags.relationship.joinModelClass)
                    .$on ("id", "product_id")
                .$havingExpr ("t0.age > 3")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH t0 AS
            (
              SELECT *
              FROM "products"
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
              LEFT JOIN "productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"

            HAVING t0.age > 3
        `)
        .commit ()

    .reset ()
        .after (s =>
        {
            s.result
                .$column ("t0.id")
                .$column ("t0.name", "nn")
                .$column ("t1.owner_id", "user_id")
                .$columnExpr ("AVG (age)", "age")
                .$from (s.Product)
                    .$with (query =>
                    {
                        query
                            .$where ("id", 4)
                            .$limit (1)
                        ;
                    })
                .$join (s.Product.fieldMap.tags.relationship.joinModelClass)
                    .$on ("id", "product_id")
                .$havingExpr ("t0.age > 3")
            ;
        })
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH t0 AS
            (
              SELECT *
              FROM "products"
              WHERE "id" = '4'
              LIMIT 1
            )

            SELECT
              t0."id",
              t0."name" AS "nn",
              t1."owner_id" AS "user_id",
              AVG (age) AS "age"

            FROM t0
              LEFT JOIN "productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"

            HAVING t0.age > 3
        `)
        .commit ()

    .should ("throw if the 'on' method is called when less than 2 tables were defined")
        .after (s =>
        {
            s.result
                .$table (s.Product.table)
                    .$with (query =>
                    {
                        query
                            .$where ("id", 4)
                            .$limit (1)
                        ;
                    })
            ;
        })
        .expectingMethodToThrow ("result.$on", ["id", "product_id"], "error.two_tables_required")
        .commit ()

    .should ("throw if the 'with' method is called when no tables were defined")
        .expectingMethodToThrow ("result.$with", null, "error.no_table_added")
        .commit ()
;
