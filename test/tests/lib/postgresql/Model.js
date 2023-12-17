test.object ("postgresql.Model", false)
    .should ("provide a default database via a static property")
        .expectingPropertyToBeOfType ("class.db", "postgresql.Database")
        .commit ()

    .should ("provide a class type parser")
        .expectingPropertyToBeOfType ("class.classTypeParser", "postgresql.Model.ClassTypeParser")
        .commit ()

    .should ("not prepend the package prefix if prefixedTableName is false")
        .up (s => s.class = s.class.defineSubclass ("test.models.User")
            .do (cls => cls.prefixedTableName = false)
        )
        .expectingPropertyToBe ("class.tableName", "users")
        .commit ()

    .should ("have two memo static propertis marshallableFields and marshallableFieldMap")
        .up (s => s.class = s.class.defineSubclass ("test.models.User")
            .field ("<id>", "string", { key: true })
            .field ("fullname", "string", { transient: true })
        )
        .expectingPropertyToBe ("class.marshallableFields.length", 1)
        .expectingPropertyToBeOfType ("class.marshallableFieldMap.id", "postgresql.Model.Field")
        .commit ()
;


test.object ("postgresql.Model.ValidationContext")
    .useMockPgClient ()
    .should ("provide a default database")
        .expectingPropertyToBeOfType ("result.db", "postgresql.Database")
        .commit ()

    .should ("use the db from the owner's model class if available")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .after (({ self, result: ctx, postgresql, User }) =>
        {
            User.db = new postgresql.Database;
            ctx.entity = new User;
            self.dbId = User.db.id;
        })
        .expectingPropertyToBe ("result.db.id", s => s.dbId)
        .commit ()
;


test.object ("postgresql.Model.ActionContext")
    .should ("provide a default QueryOptions")
        .given ()
        .expectingPropertyToBe ("result.action", "none")
        .expectingPropertyToBeOfType ("result.options", "postgresql.QueryOptions")
        .commit ()
;


test.method ("postgresql.Model.ClassTypeParser", "supports")
    .should ("return true if the given type is a class type")
        .up (s => s.createArgs = new s.postgresql.Registry)
        .given ("postgresql.Field")
        .commit ()

    .should ("return false if the given type is a primitive type")
        .up (s => s.createArgs = new s.postgresql.Registry)
        .given ("string")
        .commit ()
;


test.method ("postgresql.Model.ClassTypeParser", "lookupClass")
    .should ("return the class from registry for subclasses of postgresql.Model")
        .up (s => s.createArgs = new s.postgresql.Registry)
        .after (s => s.registeredModels = nit.values (s.object.registry.models))
        .given ("test.models.User")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.name", "test.models.User")
        .expectingPropertyToBe ("registeredModels.length", 1)
        .commit ()

    .should ("return non-model class directly")
        .up (s => s.createArgs = new s.postgresql.Registry)
        .given ("postgresql.Field")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.name", "postgresql.Field")
        .commit ()
;


test.method ("postgresql.Model.ClassTypeParser", "new")
    .useMockPgClient ()
    .should ("use nit.Model.new () to create an instance of model class")
        .up (s => s.createArgs = new s.postgresql.Registry)
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s => s.args = [s.User, { id: 1 }])
        .returnsInstanceOf ("test.models.User")
        .commit ()

    .should ("use the new operator to create an instance of non-model class")
        .up (s => s.createArgs = new s.postgresql.Registry)
        .before (s => s.args = [s.postgresql.QueryOptions])
        .returnsInstanceOf ("postgresql.QueryOptions")
        .commit ()
;


test.object ("postgresql.Model", false)
    .useMockPgClient ()
    .should ("provide a pluralized model name as the default table name")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s => s.class = s.User)
        .expectingPropertyToBe ("class.tableName", "test_users")
        .commit ()

    .should ("have a getter for primary key names")
        .before (s => s.class = s.User)
        .expectingPropertyToBe ("class.primaryKeyNames", ["id"])
        .commit ()

    .should ("have a getter for the unique key field groups")
        .defineModel ("test.models.Census", Census =>
        {
            Census
                .field ("<id>", "string", { key: true })
                .field ("<refId>", "string")
                    .constraint ("postgresql:unique")
                .field ("<city>", "string")
                .field ("<state>", "string")
                .check ("postgresql:unique", "city", "state")
            ;
        })
        .before (s => s.class = s.Census)
        .expectingPropertyToBe ("class.uniqueKeyFieldGroups.length", 2)
        .expectingPropertyToBe ("class.uniqueKeyFieldGroups.0.0.name", "refId")
        .expectingPropertyToBe ("class.uniqueKeyFieldGroups.1.0.name", "city")
        .expectingPropertyToBe ("class.uniqueKeyFieldGroups.1.1.name", "state")
        .commit ()

    .should ("have a getter for the unique key name groups")
        .before (s => s.class = s.Census)
        .expectingPropertyToBe ("class.uniqueKeyNameGroups.length", 2)
        .expectingPropertyToBe ("class.uniqueKeyNameGroups.0.0", "refId")
        .expectingPropertyToBe ("class.uniqueKeyNameGroups.1.0", "city")
        .expectingPropertyToBe ("class.uniqueKeyNameGroups.1.1", "state")
        .commit ()
;


test.object ("postgresql.Model", false)
    .useMockPgClient ()
    .should ("generate a table object that represents the model")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerModel ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.Uuid", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .expectingPropertyToBeOfType ("Country.table", "postgresql.Table")
        .expectingPropertyToBe ("Country.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_countries"
            (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("id"),
                UNIQUE ("name")
            )
        `)
        .expectingPropertyToBe ("Capital.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_capitals"
            (
                "id" UUID NOT NULL DEFAULT UUID_GENERATE_V4 (),
                "name" TEXT NOT NULL,
                "country_id" TEXT,
                "stats_population" INTEGER DEFAULT 0,
                "stats_airports" INTEGER DEFAULT 0,
                PRIMARY KEY ("id")
            )
        `)
        .expectingPropertyToBe ("Capital.fieldMap.country.relationship.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("Capital.table.constraints.0.sql", /references .*countries.*on delete set null/is)
        .expectingPropertyToBe ("Capital.table.constraints.1.sql", /unique.*country_id/is)
        .expectingPropertyToBe ("Capital.table.indexes.length", 0)
        .expectingPropertyToBe ("Country.table.constraints.length", 0)
        .expectingPropertyToBe ("Country.table.indexes.length", 0)
        .commit ()

    .should ("use the column defval from the Id class")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "postgresql.ids.Uuid", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .expectingPropertyToBe ("Capital.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_capitals"
            (
                "id" UUID NOT NULL DEFAULT UUID_GENERATE_V4 (),
                "name" TEXT NOT NULL,
                "country_id" TEXT NOT NULL,
                PRIMARY KEY ("id")
            )
        `)
        .expectingPropertyToBe ("Capital.table.constraints.0.sql", nit.trim.text`
            ALTER TABLE "test_capitals"
            ADD CONSTRAINT "test_capitals_country_id_fk" FOREIGN KEY ("country_id")
            REFERENCES "test_countries" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .commit ()

    .should ("be able to use an external model as the primary key type")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<country>", "test.models.Country", { key: true })
                .field ("<name>", "string")
            ;
        })
        .expectingPropertyToBe ("Capital.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_capitals"
            (
                "country_id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("country_id")
            )
        `)
        .expectingPropertyToBe ("Capital.table.constraints.0.sql", nit.trim.text`
            ALTER TABLE "test_capitals"
            ADD CONSTRAINT "test_capitals_country_id_fk" FOREIGN KEY ("country_id")
            REFERENCES "test_countries" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .commit ()

    .should ("add a unique constraint to the unique column")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<country>", "test.models.Country", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .expectingPropertyToBe ("Capital.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_capitals"
            (
                "country_id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("country_id"),
                UNIQUE ("name")
            )
        `)
        .expectingPropertyToBe ("Capital.table.constraints.0.sql", nit.trim.text`
            ALTER TABLE "test_capitals"
            ADD CONSTRAINT "test_capitals_country_id_fk" FOREIGN KEY ("country_id")
            REFERENCES "test_countries" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .commit ()

    .should ("be able the add a composite unique constraint")
        .defineModel ("test.models.Category", Category =>
        {
            Category
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<country>", "test.models.Country", { key: true })
                .field ("<name>", "string")
                .field ("<category>", "test.models.Category", { relType: "manyToOne" })
                .check ("postgresql:unique", "name", "category")
            ;
        })
        .expectingPropertyToBe ("Capital.fieldMap.category.relationship.ownerField.name", "category")
        .expectingPropertyToBe ("Capital.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_capitals"
            (
                "country_id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "category_id" INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY ("country_id")
            )
        `)
        .expectingPropertyToBe ("Capital.table.constraints.length", 3)
        .expectingPropertyToBe ("Capital.table.constraints.0.sql", nit.trim.text`
            ALTER TABLE "test_capitals"
            ADD CONSTRAINT "test_capitals_country_id_fk" FOREIGN KEY ("country_id")
            REFERENCES "test_countries" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("Capital.table.constraints.1.sql", nit.trim.text`
            ALTER TABLE "test_capitals"
            ADD CONSTRAINT "test_capitals_category_id_fk" FOREIGN KEY ("category_id")
            REFERENCES "test_categories" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("Capital.table.constraints.2.sql", nit.trim.text`
            ALTER TABLE "test_capitals"
            ADD CONSTRAINT "test_capitals_name_category_id_uk" UNIQUE ("name", "category_id")
        `)
        .commit ()
;


test.object ("postgresql.Model", false)
    .useMockPgClient ()
    .should ("be able to determine the one-to-many relationship")
        .defineModel ("test.models.Order", Order =>
        {
            Order
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<user>", "string")
                .field ("items...", "test.models.OrderItem")
            ;
        })
        .defineModel ("test.models.OrderItem", OrderItem =>
        {
            OrderItem
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<product>", "string")
                .field ("<unitPrice>", "integer")
                .field ("<quantity>", "integer")
                .field ("total", "integer",
                {
                    getter: function ()
                    {
                        return this.unitPrice * this.quantity;
                    }
                })
                .field ("<order>", "test.models.Order")
            ;
        })
        .expectingPropertyToBe ("Order.fieldMap.items.relationship.ownerField.name", "order")
        .expectingPropertyToBe ("Order.fieldMap.items.relType", "oneToMany")
        .expectingPropertyToBe ("OrderItem.fieldMap.order.relationship.ownerField.name", "order")
        .expectingPropertyToBe ("OrderItem.fieldMap.order.relType", "manyToOne")
        .expectingPropertyToBe ("Order.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_orders"
            (
                "id" SERIAL NOT NULL,
                "user" TEXT NOT NULL,
                PRIMARY KEY ("id")
            )
        `)
        .expectingPropertyToBe ("Order.table.constraints.length", 0)
        .expectingPropertyToBe ("OrderItem.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_orderItems"
            (
                "id" SERIAL NOT NULL,
                "product" TEXT NOT NULL,
                "unitPrice" INTEGER NOT NULL DEFAULT 0,
                "quantity" INTEGER NOT NULL DEFAULT 0,
                "order_id" INTEGER NOT NULL,
                "total" INTEGER DEFAULT 0,
                PRIMARY KEY ("id")
            )
        `)
        .expectingPropertyToBe ("OrderItem.table.constraints.length", 1)
        .expectingPropertyToBe ("OrderItem.table.constraints.0.sql", nit.trim.text`
            ALTER TABLE "test_orderItems"
            ADD CONSTRAINT "test_orderItems_order_id_fk" FOREIGN KEY ("order_id")
            REFERENCES "test_orders" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("OrderItem.table.indexes.length", 1)
        .expectingPropertyToBe ("OrderItem.table.indexes.0.sql", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_test_orderItems_order_id"
            ON "test_orderItems" ("order_id")
        `)
        .commit ()
;


test.object ("postgresql.Model", false)
    .useMockPgClient ()
    .should ("be able to generate the join table")
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
        .expectingPropertyToBe ("Product.fieldMap.tags.relationship.ownerField.name", "tags")
        .expectingPropertyToBe ("Product.fieldMap.tags.relType", "manyToMany")
        .expectingPropertyToBe ("Product.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_products"
            (
                "id" SERIAL NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("id")
            )
        `)
        .expectingPropertyToBe ("Tag.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_tags"
            (
                "id" SERIAL NOT NULL,
                "name" TEXT NOT NULL,
                PRIMARY KEY ("id"),
                UNIQUE ("name")
            )
        `)
        .expectingPropertyToBe ("Product.table.constraints.length", 0)
        .expectingPropertyToBe ("Product.table.indexes.length", 0)
        .expectingPropertyToBe ("Tag.table.constraints.length", 0)
        .expectingPropertyToBe ("Tag.table.indexes.length", 0)
        .expectingPropertyToBe ("Product.joinTables.length", 1)
        .expectingPropertyToBe ("Tag.joinTables.length", 0)
        .expectingPropertyToBe ("Product.joinTables.0.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_productTagsTagProductsLinks"
            (
                "product_id" INTEGER NOT NULL,
                "tag_id" INTEGER NOT NULL,
                PRIMARY KEY ("product_id", "tag_id")
            )
        `)
        .expectingPropertyToBe ("Product.joinTables.0.constraints.length", 2)
        .expectingPropertyToBe ("Product.joinTables.0.constraints.0.sql", nit.trim.text`
            ALTER TABLE "test_productTagsTagProductsLinks"
            ADD CONSTRAINT "test_productTagsTagProductsLinks_product_id_fk" FOREIGN KEY ("product_id")
            REFERENCES "test_products" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("Product.joinTables.0.constraints.1.sql", nit.trim.text`
            ALTER TABLE "test_productTagsTagProductsLinks"
            ADD CONSTRAINT "test_productTagsTagProductsLinks_tag_id_fk" FOREIGN KEY ("tag_id")
            REFERENCES "test_tags" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
            INITIALLY DEFERRED
        `)
        .expectingPropertyToBe ("Product.joinTables.0.indexes.length", 1)
        .expectingPropertyToBe ("Product.joinTables.0.indexes.0.sql", nit.trim.text`
            CREATE INDEX IF NOT EXISTS "idx_test_productTagsTagProductsLinks_tag_id"
            ON "test_productTagsTagProductsLinks" ("tag_id")
        `)
        .expectingPropertyToBe ("Product.tables.length", 2)
        .expectingPropertyToBe ("Tag.tables.length", 1)
        .commit ()
;


test.method ("postgresql.Model", "tagDbId", true)
    .useMockPgClient ()
        .should ("should tag the entity with the db ID")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = new s.User (1234);
        })
        .expecting ("the entity is tagged with the db ID", true, s => s.args[0][s.User.kDbId] == s.db.id)
        .expecting ("postgresql.Model.tagged () returns true for the entity", true, s => s.User.tagged (s.args[0]))
        .expecting ("postgresql.Model.untagDbId () removes the tag", undefined, s => s.User.untagDbId (s.args[0]) || s.args[0][s.User.kDbId])
        .commit ()
;


test.method ("postgresql.Model", "getPrimaryKeyValues", true)
    .useMockPgClient ()
    .should ("return the primary key values %{result}")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = new s.User (1234);
        })
        .returns ({ id: 1234 })
        .commit ()

    .reset ()
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = s.User.new (1234);
        })
        .returns ({ id: nit.new ("postgresql.ids.BigSerial", "1234") })
        .commit ()
;


test.method ("postgresql.Model", "getMarshalledPrimaryKeyValues", true)
    .useMockPgClient ()
    .should ("return the marshalled primary key values %{result}")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = new s.User (1234);
        })
        .returns ({ id: 1234 })
        .commit ()

    .reset ()
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = s.User.new (1234);
        })
        .returns ({ id: "1234" })
        .commit ()
;


test.method ("postgresql.Model", "getHashKeys", true)
    .useMockPgClient ()
    .should ("return %{result} for test.models.User { id: 1234 }")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = s.User.new (1234);
        })
        .returns ({ id: "1234" })
        .commit ()

    .should ("return %{result} for test.models.User { id: 1234 }")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = { id: 1234 };
        })
        .returns ({ id: "1234" })
        .commit ()

    .should ("return %{result} for test.models.User {}")
        .before (s =>
        {
            s.object = s.User;
            s.args = new s.User;
        })
        .returns ({})
        .commit ()

    .should ("return %{result} for postgresql.ids.BigSerial { value: \"567\" }")
        .before (s =>
        {
            s.object = s.postgresql.ids.BigSerial;
            s.args = new s.postgresql.ids.BigSerial ("567");
        })
        .returns ({ value: "567" })
        .commit ()

    .should ("return %{result} for postgresql.ids.BigSerial { value: \"\" }")
        .before (s =>
        {
            s.object = s.postgresql.ids.BigSerial;
            s.args = new s.postgresql.ids.BigSerial;
        })
        .returns ({})
        .commit ()

    .should ("return %{result} for test.models.User { id: postgresql.ids.BigSerial { value: \"1234\" } }")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = s.User.new (1234);
        })
        .returns ({ id: "1234" })
        .commit ()

    .should ("return %{result} for test.models.User { id: postgresql.ids.BigSerial { value: \"\" } }")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User;
            s.args = s.User.new ();
        })
        .returns ({})
        .commit ()

    .should ("return %{result} for test.models.Capital { country: test.models.Country { id: \"1234\" } }")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<country>", "test.models.Country", { key: true })
                .field ("<name>", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.Capital;
            s.args = s.Capital.new (s.Country.new ("1234", "USA"), "Washington D.C.");
        })
        .returns ({ country_id: "1234" })
        .commit ()

    .should ("return %{result} for test.models.Capital { country: test.models.Country { id: postgresql.ids.BigSerial { value: \"1234\" } } }")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<country>", "test.models.Country", { key: true })
                .field ("<name>", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.Capital;
            s.args = s.Capital.new (s.Country.new ("1234", "USA"), "Washington D.C.");
        })
        .returns ({ country_id: "1234" })
        .commit ()

    .should ("return %{result} for %{args.0}")
        .given ({})
        .given ()
        .returns ({})
        .commit ()
;


test.method ("postgresql.Model", "getUniqueKeyValueGroups", true)
    .useMockPgClient ()
    .should ("return %{result} for test.models.Census { id: \"1234\", refId: \"5ABC\", city: \"New York\", state: \"New York\" }")
        .defineModel ("test.models.Census", Census =>
        {
            Census
                .field ("<id>", "string", { key: true })
                .field ("<refId>", "string")
                    .constraint ("postgresql:unique")
                .field ("<city>", "string")
                .field ("<state>", "string")
                .check ("postgresql:unique", "city", "state")
            ;
        })
        .before (s =>
        {
            s.object = s.Census;
            s.args = s.Census.new ("1234", "5ABC", "New York", "New York");
        })
        .returns ([{ refId: "5ABC" }, { city: "New York", state: "New York" }])
        .commit ()
;


test.method ("postgresql.Model", "validate", true)
    .useMockPgClient ()
    .should ("validate the field values of an entity")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerModel ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                            .constraint ("min", 1)
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats", "The stats.", () => new Capital.Stats)
            ;
        })
        .before (async (s) =>
        {
            s.object = s.Country;
            s.country = s.Country.new ("1111", "USA");
            s.capital = s.Capital.new (1234, "Washington D.C.", s.country);
            s.country.capital = s.capital;
            s.args = s.country;
        })
        .throws ("error.model_validation_failed")
        .expectingPropertyToBe ("error.context.validationContext.violations.0.field", "capital.stats.population")
        .expectingPropertyToBe ("db.client.statements.0", nit.trim.text`
            SELECT *
            FROM "test_countries"
            WHERE "name" = 'USA' AND "id" <> '1111'
            LIMIT 1
        `)
        .commit ()

    .should ("validate the array fields")
        .defineModel ("test.models.Order", Order =>
        {
            Order
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<user>", "string")
                .field ("items...", "test.models.OrderItem")
            ;
        })
        .defineModel ("test.models.OrderItem", OrderItem =>
        {
            OrderItem
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<product>", "string")
                .field ("<unitPrice>", "integer")
                .field ("<quantity>", "integer")
                .field ("<order>", "test.models.Order")
            ;
        })
        .before (s =>
        {
            s.order = s.Order.new (1111, "John Doe");
            s.order.items.push (new s.OrderItem ("", "Notebook", 15, 2));
            s.order.items.push (new s.OrderItem ("", "Glue", 3, 3));

            s.object = s.Order;
            s.args = s.order;
        })
        .throws ("error.model_validation_failed")
        .expectingPropertyToBe ("error.context.validationContext.violations.0.field", "items.0.order")
        .commit ()

    .reset ()
        .before (s =>
        {
            s.order = s.Order.new (1111, "John Doe");
            s.order.items.push (new s.OrderItem ("", "Notebook", 15, 2, s.order));
            s.order.items.push (new s.OrderItem ("", "Glue", 3, 3, s.order));

            s.object = s.Order;
            s.args = s.order;
        })
        .returnsInstanceOf ("test.models.Order")
        .commit ()
;


test.method ("postgresql.Model", "marshallData", true)
    .useMockPgClient ()
    .should ("marshall the given data into an object whose property names are the table column names")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerModel ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats", "The stats.", () => new Capital.Stats)
            ;
        })
        .before (s =>
        {
            s.object = s.Country;
            s.country = s.Country.new ("1111", "USA");
            s.capital = s.Capital.new (1234, "Washington D.C.", s.country);
            s.country.capital = s.capital;
            s.args = s.country;
        })
        .returns ({ id: "1111", name: "USA" })
        .commit ()

    .reset ()
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerModel ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats", "The stats.", () => new Capital.Stats)
            ;
        })
        .before (s =>
        {
            s.object = s.Capital;
            s.country = s.Country.new ("1111", "USA");
            s.capital = s.Capital.new (1234, "Washington D.C.", s.country);
            s.country.capital = s.capital;
            s.args = s.capital;
        })
        .returns ({ id: 1234, country_id: "1111", name: "Washington D.C.", stats_airports: 0, stats_population: 0 })
        .commit ()

    .should ("skip the invalid property names")
        .before (s =>
        {
            s.object = s.Country;
            s.args = { id: "2222", invalid: "invalid value" };
        })
        .returns ({ id: "2222" })
        .commit ()

    .should ("ignore the array field of a to-many relationship")
        .defineModel ("test.models.Order", Order =>
        {
            Order
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<user>", "string")
                .field ("items...", "test.models.OrderItem")
            ;
        })
        .defineModel ("test.models.OrderItem", OrderItem =>
        {
            OrderItem
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<product>", "string")
                .field ("<unitPrice>", "integer")
                .field ("<quantity>", "integer")
                .field ("<order>", "test.models.Order")
            ;
        })
        .before (s =>
        {
            s.order = s.Order.new (1111, "John Doe");
            s.order.items.push (s.OrderItem.new (222, "Notebook", 15, 2, s.order));
            s.order.items.push (s.OrderItem.new (333, "Glue", 3, 3, s.order));

            s.object = s.Order;
            s.args = s.order;
        })
        .returns ({ id: 1111, user: "John Doe" })
        .commit ()

    .should ("ignore the empty properties")
        .before (s =>
        {
            s.order = s.Order.new (1111, "John Doe");

            s.object = s.OrderItem;
            s.args = s.OrderItem.new ("", "Notebook", 15, 2, s.order);
        })
        .returns ({ product: "Notebook", unitPrice: 15, quantity: 2, order_id: 1111 })
        .commit ()

    .should ("marshall non-model array field")
        .defineModel ("test.models.Order", Order =>
        {
            Order
                .defineInnerClass ("Note", Note =>
                {
                    Note
                        .field ("<text>", "string")
                        .field ("<date>", "string")
                    ;
                })
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<user>", "string")
                .field ("notes...", "test.models.Order.Note")

                .method ("addNote", function (text, date)
                {
                    this.notes.push (new Order.Note (text, date));
                })
            ;
        })
        .before (s =>
        {
            s.order = s.Order.new (1111, "John Doe");
            s.order.addNote ("note 1", "2023-05-05");
            s.order.addNote ("note 2", "2023-06-06");

            s.object = s.Order;
            s.args = s.order;
        })
        .returns (
        {
            id: 1111,
            user: "John Doe",
            notes:
            [
                { text: "note 1", date: "2023-05-05" },
                { text: "note 2", date: "2023-06-06" }
            ]
        })
        .expectingPropertyToBe ("Order.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_orders"
            (
                "id" SERIAL NOT NULL,
                "user" TEXT NOT NULL,
                "notes" TEXT[],
                PRIMARY KEY ("id")
            )
        `)
        .commit ()

    .should ("marshall inner model array field")
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
            s.capital = s.Capital.new ("0000-0000", "Taipei");

            s.capital.stats.push (s.Capital.Stats.new (2000, 123, 2));
            s.capital.stats.push (s.Capital.Stats.new (2010, 456, 3));

            s.object = s.Capital;
            s.args = s.capital;
        })
        .returns (
        {
            id: "0000-0000",
            name: "Taipei",
            stats:
            [
                { year: 2000, population: 123, airports: 2 },
                { year: 2010, population: 456, airports: 3 }
            ]
        })
        .expectingPropertyToBe ("Capital.table.createSql", nit.trim.text`
            CREATE TABLE IF NOT EXISTS "test_capitals"
            (
                "id" UUID NOT NULL DEFAULT UUID_GENERATE_V4 (),
                "name" TEXT NOT NULL,
                "stats" TEXT[],
                PRIMARY KEY ("id")
            )
        `)
        .commit ()
;


test.method ("postgresql.Model", "load", true)
    .useMockPgClient ()
    .should ("load an entity from the database")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .mock ("class", "find", function () { return new this.strategy.User (3); })
        .returnsInstanceOf ("test.models.User")
        .commit ()

    .should ("throw if it cannot find the entity")
        .mock ("class", "find", function () {})
        .throws ("error.entity_not_found")
        .commit ()
;


test.method ("postgresql.Model", "select", true)
    .useMockPgClient ()
    .should ("use eagerSelect if the options is 'true'")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .before (s => s.object = s.User)
        .given (true)
        .mock ("class", "eagerSelect")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("use lazySelect if the options is not specified")
        .before (s => s.object = s.User)
        .mock ("class", "lazySelect")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("use the provided query")
        .before (s => s.object = s.User)
        .before (s => s.args = s.class.Select ().From ("users"))
        .mock ("class", "lazySelect")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.sql", nit.trim.text`
            SELECT *
            FROM "users"
        `)
        .commit ()

    .reset ()
        .before (s => s.object = s.User)
        .before (s => s.args = [{ id: 5 }, s.class.Select ().From ("users")])
        .mock ("class", "lazySelect")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.sql", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '5'
        `)
        .commit ()

    .reset ()
        .before (s => s.object = s.User)
        .before (s => s.args = [{ id: 5 }, "LIMIT 1", s.class.Select ().From ("users")])
        .mock ("class", "lazySelect")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.sql", nit.trim.text`
            SELECT *
            FROM "users"
            WHERE "id" = '5'
            LIMIT 1
        `)
        .commit ()
;


test.method ("postgresql.Model", "eagerSelect", true)
    .useMockPgClient ()
    .should ("should not add the CTE if the select query is a 'SELECT *' one")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "intstr", { key: true })
                .field ("<name>", "string")
                .field ("owner", "test.models.User")
            ;
        })
        .before (s =>
        {
            s.Product.db = s.db;
            s.object = s.Product;
            s.args = s.class.Select ().From (s.Product);
        })
        .mock ("db", "fetchAll", () =>
        [
        {
            t0_id: 1,
            t0_name: "Notebook",
            t0_owner_id: 2,
            t1_id: 2,
            t1_name: "John Doe"
        }
        ])
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.sql", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name",
              t0."owner_id" AS "t0_owner_id"
              ,
              t1."id" AS "t1_id",
              t1."name" AS "t1_name"

            FROM "test_products" t0
              LEFT JOIN "test_users" t1 ON t1."id" = t0."owner_id"
        `)
        .expectingPropertyToBeOfType ("result.0", "test.models.Product")
        .expectingPropertyToBeOfType ("result.0.owner", "test.models.User")
        .commit ()
;


test.method ("postgresql.Model", "eagerSelect", true)
    .useMockPgClient ()
    .should ("should add the CTE if the select query has some conditions")
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "intstr", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag", { relType: "manyToMany" })
            ;
        })
        .before (s =>
        {
            s.Product.db = s.db;
            s.object = s.Product;
            s.args = s.class.Select ().From (s.Product).Where ("age", 3, ">");
        })
        .mock ("db", "fetchAll", () => [
        {
            t0_id: 1,
            t0_name: "Notebook",
            t1_product_id: 1,
            t1_tag_id: 2,
            t2_id: 2,
            t2_name: "TAG A"
        }
        ,
        {
            t0_id: 1,
            t0_name: "Notebook",
            t1_product_id: 1,
            t1_tag_id: 3,
            t2_id: 3,
            t2_name: "TAG B"
        }
        ])
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.sql", nit.trim.text`
            WITH t0 AS
            (
              SELECT *
              FROM "test_products"
              WHERE "age" > '3'
            )

            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"
              ,
              t1."product_id" AS "t1_product_id",
              t1."tag_id" AS "t1_tag_id"
              ,
              t2."id" AS "t2_id",
              t2."name" AS "t2_name"

            FROM t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
              LEFT JOIN "test_tags" t2 ON t2."id" = t1."tag_id"
        `)
        .expectingPropertyToBeOfType ("result.0", "test.models.Product")
        .expectingPropertyToBeOfType ("result.0.tags.0", "test.models.Tag")
        .expectingPropertyToBeOfType ("result.0.tags.1", "test.models.Tag")
        .expectingMethodToReturnValue ("result.0.toPojo", null,
        {
            id: 1,
            name: "Notebook",
            tags:
            [
                { id: 2, name: "TAG A" },
                { id: 3, name: "TAG B" }
            ]
        })
        .commit ()

    .should ("should merge the CTE with the filter from the relationshiPath")
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "integer", { key: true })
                .field ("name", "string")
            ;
        })
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "intstr", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag", { relType: "manyToMany" })
            ;
        })
        .before (s =>
        {
            s.Product.db = s.db;
            s.object = s.Product;
            s.args = [
                s.class.Select ().From (s.Product).WhereExpr ("LENGTH (name) > 10"),
                nit.new ("postgresql.QueryOptions",
                {
                    relationships:
                    {
                        path: "Product",
                        filter: "name ILIKE 'jo%'"
                    }
                })
            ];
        })
        .expectingMethodToReturnValue ("object.db.client.statements.join", "\n--\n", nit.trim.text`
            WITH t0 AS
            (
              SELECT *
              FROM "test_products"
              WHERE name ILIKE 'jo%' AND LENGTH (name) > 10
            )

            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"
              ,
              t1."product_id" AS "t1_product_id",
              t1."tag_id" AS "t1_tag_id"
              ,
              t2."id" AS "t2_id",
              t2."name" AS "t2_name"

            FROM t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
              LEFT JOIN "test_tags" t2 ON t2."id" = t1."tag_id"
        `)
        .commit ()
;


test.method ("postgresql.Model", "marshall", true)
    .useMockPgClient ()
    .should ("marshall an entity into a row object")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .before (s =>
        {
            s.country = s.Country.new (1111, "USA");
            s.capital = s.Capital.new (1234, "Washington D.C.", s.country);
            s.ctx = new s.Capital.ActionContext;
            s.args = [s.capital, s.ctx];
        })
        .returns ({ id: 1234, name: "Washington D.C.", country_id: 1111 })
        .commit ()

    .should ("use the old data if the entity has been marshalled before")
        .before (s =>
        {
            s.args = [s.capital, s.ctx];
        })
        .returns ({ id: 1234, name: "Washington D.C.", country_id: 1111 })
        .commit ()

    .should ("create a new ActionContext if not provided")
        .before (s =>
        {
            s.args = s.capital;
        })
        .returns ({ id: 1234, name: "Washington D.C.", country_id: 1111 })
        .commit ()
;


test.method ("postgresql.Model", "unmarshall", true)
    .useMockPgClient ()
    .should ("unmarshall a row object an entity")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .defineModel ("test.models.Stats", Stats =>
        {
            Stats
                .field ("population", "integer")
                .field ("airports", "integer")
            ;
        })
        .before (s =>
        {
            s.capital = new s.Capital;
            s.row = {};
            s.args = [s.row, s.capital];
        })
        .returnsInstanceOf ("test.models.Capital")
        .commit ()

    .should ("use the current class to create an entity if not provided")
        .before (s =>
        {
            s.object = s.Capital;
            s.row = {};
            s.args = [];
        })
        .returnsInstanceOf ("test.models.Capital")
        .commit ()

    .should ("assign the row data to the created entity if it has no primary key(s)")
        .before (s =>
        {
            s.object = s.Stats;
            s.row = { airports: 3 };
            s.args = [s.row];
        })
        .returnsInstanceOf ("test.models.Stats")
        .expectingPropertyToBe ("result.airports", 3)
        .commit ()
;
