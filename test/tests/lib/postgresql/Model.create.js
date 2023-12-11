test.method ("postgresql.Model", "create", true)
    .useMockDatabase ()
    .should ("create and insert an entity with the given constructor arguments")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .before (s => s.object = s.User)
        .given (123, "John Doe")
        .returnsInstanceOf ("test.models.User")
        .expectingMethodToReturnValue ("result.toPojo", null, { id: 123, name: "John Doe" })
        .expectingMethodToReturnValue ("db.select", "test_users", [{ id: 123, name: "John Doe" }])
        .commit ()

    .should ("be able to persist inner model array field")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerModel ("Stats", Stats =>
                {
                    Stats
                        .field ("<year>", "integer")
                        .field ("[population]", "integer")
                        .field ("[airports]", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.Uuid", { key: true })
                .field ("<name>", "string")
                .field ("stats...", "test.models.Capital.Stats")
            ;
        })
        .before (s =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .given ("", "Taipei",
        {
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        })
        .returnsInstanceOf ("test.models.Capital")
        .expectingMethodToReturnValue ("db.select", "test_capitals",
        [
        {
            id: "aa69a37c-811a-4537-b3da-88b7af70be1c",
            name: "Taipei",
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        }
        ])
        .commit ()

    .should ("be able to persist an object array field")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerClass ("Stats", Stats =>
                {
                    Stats
                        .field ("<year>", "integer")
                        .field ("[population]", "integer")
                        .field ("[airports]", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.Uuid", { key: true })
                .field ("<name>", "string")
                .field ("stats...", "test.models.Capital.Stats", { columnType: "JSONB" })
            ;
        })
        .before (s =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .given ("", "Tokyo",
        {
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        })
        .returnsInstanceOf ("test.models.Capital")
        .expectingMethodToReturnValue ("db.select", "test_capitals",
        [
        {
            id: "aa69a37c-811a-4537-b3da-88b7af70be1c",
            name: "Tokyo",
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        }
        ])
        .commit ()

    .should ("be able to persist an string array field")
        .defineModel ("test.models.Book", Book =>
        {
            Book
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.Book;
        })
        .given (10, "Learn JavaScript", { tags: ["a", "b"] })
        .returnsInstanceOf ("test.models.Book")
        .expectingMethodToReturnValue ("db.select", "test_books",
        [
        {
            id: 10,
            name: "Learn JavaScript",
            tags: ["a", "b"]
        }
        ])
        .commit ()

    .should ("be able to persist a many-to-many relationship")
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag")
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
        .before (s =>
        {
            s.object = s.Product;
        })
        .given (10, "Notebook",
        {
            tags:
            [
                { id: 2, name: "a" },
                { id: 3, name: "b" }
            ]

        }, nit.require ("postgresql.QueryOptions").cascade ())
        .returnsInstanceOf ("test.models.Product")
        .expectingMethodToReturnValue ("db.select", "test_products", [{ id: 10, name: "Notebook" }])
        .expectingMethodToReturnValue ("db.select", "test_tags",
        [
            { id: 2, name: "a" },
            { id: 3, name: "b" }
        ])
        .expectingMethodToReturnValue ("db.select", "test_productTagsTagProductsLinks",
        [
            { product_id: 10, tag_id: 2 },
            { product_id: 10, tag_id: 3 }
        ])
        .commit ()

    .should ("be able to persist a one-to-many relationship")
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("tag", "test.models.Tag")
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
        .before (s =>
        {
            s.object = s.Product;
        })
        .given (10, "Notebook",
        {
            tag: { id: 2, name: "a" }

        }, nit.require ("postgresql.QueryOptions").cascade ())
        .returnsInstanceOf ("test.models.Product")
        .expectingMethodToReturnValue ("db.select", "test_products", [{ id: 10, name: "Notebook", tag_id: 2 }])
        .expectingMethodToReturnValue ("db.select", "test_tags", [{ id: 2, name: "a" }])
        .commit ()

    .should ("be able to persist a one-to-one relationship")
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("maker", "test.models.Maker")
            ;
        })
        .defineModel ("test.models.Maker", Maker =>
        {
            Maker
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("product", "test.models.Product")
            ;
        })
        .before (s =>
        {
            s.object = s.Product;
        })
        .given (10, "Notebook",
        {
            maker: { id: 2, name: "a" }

        }, nit.require ("postgresql.QueryOptions").cascade ())
        .returnsInstanceOf ("test.models.Product")
        .expectingMethodToReturnValue ("db.select", "test_products", [{ id: 10, name: "Notebook" }])
        .expectingMethodToReturnValue ("db.select", "test_makers", [{ id: 2, name: "a", product_id: 10 }])
        .commit ()
;
