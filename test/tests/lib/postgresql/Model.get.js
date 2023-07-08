test.method ("postgresql.Model", "get", true)
    .useMockDatabase ()
    .should ("find the entity with the primary key values")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.User;

            await s.User.new (123, "John Doe").save ();
        })
        .given (123)
        .returnsInstanceOf ("test.models.User")
        .expectingMethodToReturnValue ("result.toPojo", null, { id: 123, name: "John Doe" })
        .commit ()

    .should ("be able to return an entity with an inner model array field")
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
        .before (async (s) =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");

            await s.Capital.new ("", "Taipei",
            {
                stats:
                [
                    { year: 2000, population: 123, airports: 2 },
                    { year: 2010, population: 456, airports: 3 }
                ]

            }).save ();
        })
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .returnsInstanceOf ("test.models.Capital")
        .expectingPropertyToBeOfType ("result.stats.0", "test.models.Capital.Stats")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id:
            {
                value: "aa69a37c-811a-4537-b3da-88b7af70be1c"
            }
            ,
            name: "Taipei",
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        })
        .commit ()

    .should ("be able to return an entity with an inner class array field")
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
                .field ("stats...", "test.models.Capital.Stats")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");

            await s.Capital.new ("", "Taipei",
            {
                stats:
                [
                    { year: 2000, population: 123, airports: 2 },
                    { year: 2010, population: 456, airports: 3 }
                ]

            }).save ();
        })
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .returnsInstanceOf ("test.models.Capital")
        .expectingPropertyToBeOfType ("result.stats.0", "test.models.Capital.Stats")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id:
            {
                value: "aa69a37c-811a-4537-b3da-88b7af70be1c"
            }
            ,
            name: "Taipei",
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        })
        .commit ()

    .should ("be able to return an entity with an inner model field")
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
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");

            await s.Capital.new ("", "Taipei",
            {
                stats: { year: 2000, population: 123, airports: 2 }

            }).save ();
        })
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .returnsInstanceOf ("test.models.Capital")
        .expectingPropertyToBeOfType ("result.stats", "test.models.Capital.Stats")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id:
            {
                value: "aa69a37c-811a-4537-b3da-88b7af70be1c"
            }
            ,
            name: "Taipei",
            stats: { year: 2000, population: 123, airports: 2 }
        })
        .commit ()

    .should ("be able to return an entity with an inner class field")
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
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");

            await s.Capital.new ("", "Taipei",
            {
                stats: { year: 2000, population: 123, airports: 2 }

            }).save ();
        })
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .returnsInstanceOf ("test.models.Capital")
        .expectingPropertyToBeOfType ("result.stats", "test.models.Capital.Stats")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id:
            {
                value: "aa69a37c-811a-4537-b3da-88b7af70be1c"
            }
            ,
            name: "Taipei",
            stats: { year: 2000, population: 123, airports: 2 }
        })
        .commit ()

    .should ("be able to retrieve an entity with object array field")
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
        .before (async (s) =>
        {
            s.object = s.Capital;

            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");

            await s.Capital.new ("", "Tokyo",
            {
                stats:
                [
                    { year: 2000, population: 123, airports: 2 },
                    { year: 2010, population: 456, airports: 3 }
                ]

            }).save ();
        })
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .returnsInstanceOf ("test.models.Capital")
        .expectingPropertyToBeOfType ("result.stats.0", "test.models.Capital.Stats")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: { value: "aa69a37c-811a-4537-b3da-88b7af70be1c" },
            name: "Tokyo",
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        })
        .commit ()

    .should ("be able to retrieve an entity with string array field")
        .defineModel ("test.models.Book", Book =>
        {
            Book
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "string")
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Book;

            await s.Book.new (10, "Learn JavaScript", { tags: ["a", "b"] }).save ();
        })
        .given (10)
        .returnsInstanceOf ("test.models.Book")
        .expectingPropertyToBeOfType ("result.tags.0", "string")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: 10,
            name: "Learn JavaScript",
            tags: ["a", "b"]
        })
        .commit ()

    .should ("be able to retrieve the entities of a many-to-many relationship")
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
        .before (async (s) =>
        {
            s.object = s.Product;

            await s.Product.new (10, "Notebook",
            {
                tags:
                [
                    { id: 2, name: "a" },
                    { id: 3, name: "b" }
                ]
                ,
                owner:
                {
                    id: 5,
                    name: "John Doe"
                }

            }).save (true);
        })
        .given (10, nit.require ("postgresql.QueryOptions").eager ())
        .returnsInstanceOf ("test.models.Product")
        .expectingPropertyToBeOfType ("result.owner", "test.models.User")
        .expectingPropertyToBeOfType ("result.tags.0", "test.models.Tag")
        .expectingPropertyToBeOfType ("result.tags.1", "test.models.Tag")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: { value: 10 },
            name: "Notebook",
            owner:
            {
                id: { value: 5 },
                name: "John Doe"
            }
            ,
            tags:
            [
                { id: { value: 2 }, name: "a", products: [] },
                { id: { value: 3 }, name: "b", products: [] }
            ]
        })
        .commit ()

    .should ("be able to retrieve the entities of a many-to-many relationship with a custom join table")
        .defineModel ("test.models.Activity", Activity =>
        {
            Activity
                .field ("<id>", "integer", { key: true })
                .field ("<title>", "string")
                .field ("performers...", "test.models.Performer", { through: "test.models.ActivityPerformer" })
                .field ("extra", "test.models.ActivityPerformer.Extra")
            ;
        })
        .defineModel ("test.models.Performer", Performer =>
        {
            Performer
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("activities...", "test.models.Activity")
                .field ("extra", "test.models.ActivityPerformer.Extra")
            ;
        })
        .defineModel ("test.models.ActivityPerformer", ActivityPerformer =>
        {
            ActivityPerformer
                .field ("<activity>", "test.models.Activity", { key: true, relType: "manyToOne" })
                .field ("<performer>", "test.models.Performer", { key: true, relType: "manyToOne" })
                .defineExtra (Extra =>
                {
                    Extra
                        .field ("[displayOrder]", "integer")
                        .field ("[status]", "string")
                    ;
                })
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Activity;

            await s.Activity.new (1, "Dance",
            {
                performers:
                [
                    { id: 2, name: "John Doe", extra: { displayOrder: 1, status: "a" } },
                    { id: 3, name: "Jane Doe", extra: { displayOrder: 2, status: "b" } }
                ]

            }).save (true);
        })
        .given (1, nit.require ("postgresql.QueryOptions").eager ())
        .returnsInstanceOf ("test.models.Activity")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: 1,
            title: "Dance",
            performers:
            [
                {
                    id: 2,
                    name: "John Doe",
                    extra: { displayOrder: 1, status: "a" },
                    activities: []
                }
                ,
                {
                    id: 3,
                    name: "Jane Doe",
                    extra: { displayOrder: 2, status: "b" },
                    activities: []
                }
            ]
        })
        .expecting ("performer 2 to be %{value|format}",
            {
                id: 2,
                name: "John Doe",
                activities:
                [
                {
                    id: 1,
                    title: "Dance",
                    extra: { displayOrder: 1, status: "a" },
                    performers: []
                }
                ]
            }
            ,
            async (s) => (await s.Performer.get (2, nit.require ("postgresql.QueryOptions").eager ())).toPojo ()
        )
        .expecting ("performer 3 to be %{value|format}",
            {
                id: 3,
                name: "Jane Doe",
                activities:
                [
                {
                    id: 1,
                    title: "Dance",
                    extra: { displayOrder: 2, status: "b" },
                    performers: []
                }
                ]
            }
            ,
            async (s) => (await s.Performer.get (3, nit.require ("postgresql.QueryOptions").eager ())).toPojo ()
        )
        .commit ()

    .should ("be able to retrieve a one-to-one relationship")
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
        .before (async (s) =>
        {
            s.object = s.Product;

            await s.Product.new (10, "Notebook",
            {
                maker: { id: 2, name: "a" }

            }).save (true);
        })
        .given (10, nit.require ("postgresql.QueryOptions").eager ())
        .returnsInstanceOf ("test.models.Product")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: { value: 10 },
            name: "Notebook",
            maker:
            {
                id: { value: 2 },
                name: "a",
                product: null
            }
        })
        .expecting ("maker to be %{value|format}",
            {
                id: { value: 2 },
                name: "a",
                product:
                {
                    id: { value: 10 },
                    name: "Notebook",
                    maker: null
                }
            }
            ,
            async (s) => (await s.Maker.get (2, nit.require ("postgresql.QueryOptions").eager ())).toPojo ()
        )
        .commit ()

    .should ("be able to retrieve a self-referencing relationship")
        .defineModel ("test.models.Person", Person =>
        {
            Person
                .constant ("tableName", "persons")
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("father", "test.models.Person", { relType: "manyToOne" })
                .field ("mother", "test.models.Person", { relType: "manyToOne" })
                .field ("children...", "test.models.Person", { mappedBy: "father" })
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Person;

            await s.Person.new ("", "Me",
            {
                father: { name: "Father" },
                mother: { name: "Mother" },
                children: [{ name: "Child 1" }, { name: "Child 2" }]

            }).save (true);

        })
        .given (1, nit.require ("postgresql.QueryOptions").eager ())
        .returnsInstanceOf ("test.models.Person")
        .expectingPropertyToBe ("result.father.children.0.id.value", 1)
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: { value: 1 },
            name: "Me",
            father:
            {
                id: { value: 2 },
                name: "Father",
                father: undefined,
                mother: undefined,
                children: [null]
            }
            ,
            mother:
            {
                id: { value: 3 },
                name: "Mother",
                father: undefined,
                mother: undefined,
                children: []
            }
            ,
            children:
            [
                { id: { value: 4 }, name: "Child 1", father: null, mother: undefined, children: [] },
                { id: { value: 5 }, name: "Child 2", father: null, mother: undefined, children: [] }
            ]
        })
        .expecting ("person 2 to be %{value|format}",
            {
                id: { value: 2 },
                name: "Father",
                father: undefined,
                mother: undefined,
                children:
                [
                {
                    id: { value: 1 },
                    name: "Me",
                    father: null,
                    mother:
                    {
                        id: { value: 3 },
                        name: "",
                        father: undefined,
                        mother: undefined,
                        children: []
                    }
                    ,
                    children: []
                }
                ]
            }
            ,
            async (s) => (await s.Person.get (2, nit.require ("postgresql.QueryOptions").eager ())).toPojo ()
        )
        .commit ()

    .should ("be able to retrieve a self-referencing relationship")
        .defineModel ("test.models.Category", Category =>
        {
            Category
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("parent", "test.models.Category")
                .field ("subcategories...", "test.models.Category", { mappedBy: "parent" })
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Category;

            await s.Category.new ("", "Main 1",
            {
                subcategories: [{ name: "Sub 1" }, { name: "Sub 2" }]

            }).save (true);
        })
        .given (1, nit.require ("postgresql.QueryOptions").eager ())
        .returnsInstanceOf ("test.models.Category")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: { value: 1 },
            name: "Main 1",
            subcategories:
            [
                { id: { value: 2 }, name: "Sub 1", parent: null, subcategories: [] },
                { id: { value: 3 }, name: "Sub 2", parent: null, subcategories: [] }
            ]
        })
        .expecting ("sub 1 to be %{value|format}",
            {
                id: { value: 2 },
                name: "Sub 1",
                parent:
                {
                    id: { value: 1 },
                    name: "Main 1",
                    subcategories: [null]
                }
                ,
                subcategories: []
            }
            ,
            async (s) => (await s.Category.get (2, nit.require ("postgresql.QueryOptions").eager ())).toPojo ()
        )
        .commit ()
;
