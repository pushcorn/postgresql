test.method ("postgresql.RelationshipPath", "new", true)
    .useMockPgClient ()
    .should ("return undefined if the field does not have a relationship")
        .given ({})
        .returns ()
        .commit ()

    .should ("create the access path for fields of a many-to-many relationship")
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
        .before (s => s.args = s.Product.fieldMap.owner)
        .returnsInstanceOf ("postgresql.RelationshipPath")
        .expectingMethodToReturnValueContaining ("result.toPojo", null,
        {
            type: "oneToOne",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Product" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.User" },
                owner: "t0",
                field: "owner",
                relType: "oneToOne",
                joins: [{ from: "owner_id", to: "id" }],
                linkColumns: [],
                inverseLinkColumns: [{ from: "id", to: "owner_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("Product.owner", nit.trim.text`
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
        .expectingMethodToReturnValueContaining ("Product.fieldMap.tags.relationshipPath.toPojo", null,
        {
            type: "manyToMany",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Product" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.ProductTagsTagProductsLink" },
                owner: "t0",
                field: "tags",
                relType: "manyToMany",
                joins: [{ from: "id", to: "product_id" }],
                linkColumns: [{ from: "id", to: "product_id" }],
                inverseLinkColumns: [{ from: "tag_id", to: "tags_id" }]
            }
            ,
            {
                alias: "t2",
                class: { name: "test.models.Tag" },
                owner: "t1",
                field: "tag",
                relType: "manyToOne",
                joins: [{ from: "tag_id", to: "id" }],
                linkColumns: [{ from: "tag_id", to: "id" }],
                inverseLinkColumns: [{ from: "id", to: "tag_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("Product.tags", nit.trim.text`
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

            FROM "test_products" t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
              LEFT JOIN "test_tags" t2 ON t2."id" = t1."tag_id"
        `)
        .expectingMethodToReturnValueContaining ("Tag.fieldMap.products.relationshipPath.toPojo", null,
        {
            type: "manyToMany",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Tag" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.ProductTagsTagProductsLink" },
                owner: "t0",
                field: "products",
                relType: "manyToMany",
                joins: [{ from: "id", to: "tag_id" }],
                linkColumns: [{ from: "id", to: "tag_id" }],
                inverseLinkColumns: [{ from: "product_id", to: "products_id" }]
            }
            ,
            {
                alias: "t2",
                class: { name: "test.models.Product" },
                owner: "t1",
                field: "product",
                relType: "manyToOne",
                joins: [{ from: "product_id", to: "id" }],
                linkColumns: [{ from: "product_id", to: "id" }],
                inverseLinkColumns: [{ from: "id", to: "product_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("Tag.products", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"
              ,
              t1."product_id" AS "t1_product_id",
              t1."tag_id" AS "t1_tag_id"
              ,
              t2."id" AS "t2_id",
              t2."name" AS "t2_name",
              t2."owner_id" AS "t2_owner_id"

            FROM "test_tags" t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."tag_id" = t0."id"
              LEFT JOIN "test_products" t2 ON t2."id" = t1."product_id"
        `)
        .expectingModelEagerQueryToBe ("Product", nit.trim.text`
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

            FROM "test_products" t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."product_id" = t0."id"
              LEFT JOIN "test_tags" t2 ON t2."id" = t1."tag_id"
              LEFT JOIN "test_users" t3 ON t3."id" = t0."owner_id"
        `)
        .expectingModelEagerQueryToBe ("Tag", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"
              ,
              t1."product_id" AS "t1_product_id",
              t1."tag_id" AS "t1_tag_id"
              ,
              t2."id" AS "t2_id",
              t2."name" AS "t2_name",
              t2."owner_id" AS "t2_owner_id"

            FROM "test_tags" t0
              LEFT JOIN "test_productTagsTagProductsLinks" t1 ON t1."tag_id" = t0."id"
              LEFT JOIN "test_products" t2 ON t2."id" = t1."product_id"
        `)
        .expectingModelEagerQueryToBe ("User", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"

            FROM "test_users" t0
        `)
        .commit ()

    .should ("create the access path for fields of a one-to-one relationship")
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
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .before (s => s.args = s.Country.fieldMap.capital)
        .returnsInstanceOf ("postgresql.RelationshipPath")
        .expectingMethodToReturnValueContaining ("result.toPojo", null,
        {
            type: "oneToOne",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Country" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.Capital" },
                field: "capital",
                owner: "t0",
                relType: "oneToOne",
                joins: [{ from: "id", to: "country_id" }],
                linkColumns: [{ from: "id", to: "country_id" }],
                inverseLinkColumns: [{ from: "id", to: "capital_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("Country.capital", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"
              ,
              t1."id" AS "t1_id",
              t1."name" AS "t1_name",
              t1."country_id" AS "t1_country_id"

            FROM "test_countries" t0
              LEFT JOIN "test_capitals" t1 ON t1."country_id" = t0."id"
        `)
        .expectingMethodToReturnValueContaining ("Capital.fieldMap.country.relationshipPath.toPojo", null,
        {
            type: "oneToOne",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Capital" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.Country" },
                field: "country",
                owner: "t0",
                relType: "oneToOne",
                joins: [{ from: "country_id", to: "id" }],
                linkColumns: [{ from: "id", to: "capital_id" }],
                inverseLinkColumns: [{ from: "id", to: "country_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("Capital.country", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name",
              t0."country_id" AS "t0_country_id"
              ,
              t1."id" AS "t1_id",
              t1."name" AS "t1_name"

            FROM "test_capitals" t0
              LEFT JOIN "test_countries" t1 ON t1."id" = t0."country_id"
        `)
        .expectingModelEagerQueryToBe ("Country", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name"
              ,
              t1."id" AS "t1_id",
              t1."name" AS "t1_name",
              t1."country_id" AS "t1_country_id"

            FROM "test_countries" t0
              LEFT JOIN "test_capitals" t1 ON t1."country_id" = t0."id"
        `)
        .expectingModelEagerQueryToBe ("Capital", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name",
              t0."country_id" AS "t0_country_id"
              ,
              t1."id" AS "t1_id",
              t1."name" AS "t1_name"

            FROM "test_capitals" t0
              LEFT JOIN "test_countries" t1 ON t1."id" = t0."country_id"
        `)
        .commit ()

    .should ("create the access path for fields of a one-to-many relationship")
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
                .field ("order", "test.models.Order")
            ;
        })
        .before (s => s.args = s.Order.fieldMap.items)
        .returnsInstanceOf ("postgresql.RelationshipPath")
        .expectingMethodToReturnValueContaining ("result.toPojo", null,
        {
            type: "oneToMany",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Order" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.OrderItem" },
                field: "items",
                owner: "t0",
                relType: "oneToMany",
                joins: [{ from: "id", to: "order_id" }],
                linkColumns: [{ from: "id", to: "order_id" }],
                inverseLinkColumns: [{ from: "id", to: "items_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("Order.items", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."user" AS "t0_user"
              ,
              t1."id" AS "t1_id",
              t1."product" AS "t1_product",
              t1."unitPrice" AS "t1_unitPrice",
              t1."quantity" AS "t1_quantity",
              t1."total" AS "t1_total",
              t1."order_id" AS "t1_order_id"

            FROM "test_orders" t0
              LEFT JOIN "test_orderItems" t1 ON t1."order_id" = t0."id"
        `)
        .expectingMethodToReturnValueContaining ("OrderItem.fieldMap.order.relationshipPath.toPojo", null,
        {
            type: "manyToOne",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.OrderItem" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.Order" },
                field: "order",
                owner: "t0",
                relType: "manyToOne",
                joins: [{ from: "order_id", to: "id" }],
                linkColumns: [{ from: "id", to: "items_id" }],
                inverseLinkColumns: [{ from: "id", to: "order_id" }]
            }
            ]
        })
        .expectingFieldEagerQueryToBe ("OrderItem.order", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."product" AS "t0_product",
              t0."unitPrice" AS "t0_unitPrice",
              t0."quantity" AS "t0_quantity",
              t0."total" AS "t0_total",
              t0."order_id" AS "t0_order_id"
              ,
              t1."id" AS "t1_id",
              t1."user" AS "t1_user"

            FROM "test_orderItems" t0
              LEFT JOIN "test_orders" t1 ON t1."id" = t0."order_id"
        `)
        .expectingModelEagerQueryToBe ("Order", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."user" AS "t0_user"
              ,
              t1."id" AS "t1_id",
              t1."product" AS "t1_product",
              t1."unitPrice" AS "t1_unitPrice",
              t1."quantity" AS "t1_quantity",
              t1."total" AS "t1_total",
              t1."order_id" AS "t1_order_id"

            FROM "test_orders" t0
              LEFT JOIN "test_orderItems" t1 ON t1."order_id" = t0."id"
        `)
        .expectingModelEagerQueryToBe ("OrderItem", nit.trim.text`
            SELECT
              t0."id" AS "t0_id",
              t0."product" AS "t0_product",
              t0."unitPrice" AS "t0_unitPrice",
              t0."quantity" AS "t0_quantity",
              t0."total" AS "t0_total",
              t0."order_id" AS "t0_order_id"
              ,
              t1."id" AS "t1_id",
              t1."user" AS "t1_user"

            FROM "test_orderItems" t0
              LEFT JOIN "test_orders" t1 ON t1."id" = t0."order_id"
        `)
        .commit ()

    .should ("be setup the extra field is defined")
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
        .before (s => s.args = s.Activity.fieldMap.performers)
        .returnsInstanceOf ("postgresql.RelationshipPath")
        .expectingMethodToReturnValueContaining ("result.toPojo", null,
        {
            type: "manyToMany",
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Activity" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.ActivityPerformer" },
                owner: "t0",
                field: "performers",
                relType: "manyToMany",
                joins: [{ from: "id", to: "activity_id" }],
                linkColumns: [{ from: "id", to: "activity_id" }],
                inverseLinkColumns: [{ from: "performer_id", to: "performers_id" }]
            }
            ,
            {
                alias: "t2",
                class: { name: "test.models.Performer" },
                owner: "t1",
                field: "performer",
                relType: "manyToOne",
                extraClass: { name: "test.models.ActivityPerformer.Extra" },
                extraField: "extra",
                joins: [{ from: "performer_id", to: "id" }],
                linkColumns: [{ from: "performer_id", to: "id" }],
                inverseLinkColumns: [{ from: "id", to: "performer_id" }]
            }
            ]
        })
        .commit ()
;


test.method ("postgresql.RelationshipPath", "toQuery", { recreate: false })
    .useMockPgClient ()
    .should ("build and return a query object from the relationship path")
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
        .before (s => s.object = s.Product.fieldMap.owner.relationshipPath)
        .given (nit.new ("postgresql.QueryOptions",
        {
            relationships:
            {
                path: "Product.owner",
                filter: "name ILIKE 'john'",
                alias: "u"
            }
        }))
        .returnsInstanceOf ("postgresql.queries.EagerSelect")
        .expectingPropertyToBe ("result.sql", nit.trim.text`
            WITH u AS
            (
              SELECT *
              FROM "test_users"
              WHERE name ILIKE 'john'
            )

            SELECT
              t0."id" AS "t0_id",
              t0."name" AS "t0_name",
              t0."owner_id" AS "t0_owner_id"
              ,
              u."id" AS "u_id",
              u."name" AS "u_name"

            FROM "test_products" t0
              LEFT JOIN u ON u."id" = t0."owner_id"
        `)
        .commit ()
;


test.method ("postgresql.RelationshipPath", "append", { recreate: false })
    .useMockPgClient ()
    .should ("append the models of the given relationship path to the current one")
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
        .before (s => s.object = new s.class ({ models: s.Product.fieldMap.owner.relationshipPath.models.slice (0, 1) }))
        .before (s => s.args = s.Product.fieldMap.tags.relationshipPath)
        .returns ()
        .expectingMethodToReturnValueContaining ("object.toPojo", null,
        {
            models:
            [
            {
                alias: "t0",
                class: { name: "test.models.Product" }
            }
            ,
            {
                alias: "t1",
                class: { name: "test.models.ProductTagsTagProductsLink" },
                owner: "t0",
                field: "tags",
                relType: "manyToMany",
                joins: [{ from: "id", to: "product_id" }],
                linkColumns: [{ from: "id", to: "product_id" }],
                inverseLinkColumns: [{ from: "tag_id", to: "tags_id" }]
            }
            ,
            {
                alias: "t2",
                class: { name: "test.models.Tag" },
                owner: "t1",
                field: "tag",
                relType: "manyToOne",
                joins: [{ from: "tag_id", to: "id" }],
                linkColumns: [{ from: "tag_id", to: "id" }],
                inverseLinkColumns: [{ from: "id", to: "tag_id" }]
            }
            ]
        })
        .commit ()
;


test.method ("postgresql.RelationshipPath", "unmarshall", { recreate: false })
    .useMockPgClient ()
    .should ("convert the rows from a eager select")
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
        .before (s => s.object = s.Activity.fieldMap.performers.relationshipPath)
        .given (
        {
            t0_id: 1,
            t0_title: "Dance",
            t1_activity_id: 1,
            t1_performer_id: 2,
            t1_displayOrder: 1,
            t1_status: "a",
            t2_id: 2,
            t2_name: "John Doe"
        })
        .returnsInstanceOf ("test.models.Activity")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: 1,
            title: "Dance",
            extra: undefined,
            performers:
            [
                {
                    id: 2,
                    name: "John Doe",
                    extra: { displayOrder: 1, status: "a" },
                    activities: []
                }
            ]
        })
        .commit ()

    .should ("be able to unmarshall a one-to-one relationship row")
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
        .before (s => s.object = s.Product.fieldMap.maker.relationshipPath)
        .given (
        {
            t0_id: 10,
            t0_name: "Notebook",
            t1_id: 2,
            t1_name: "a",
            t1_product_id: 10
        })
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
        .commit ()

    .reset ()
        .before (s => s.object = s.Maker.fieldMap.product.relationshipPath)
        .given (
        {
            t0_id: 2,
            t0_name: "a",
            t0_product_id: 10,
            t1_id: 10,
            t1_name: "Notebook"
        })
        .returnsInstanceOf ("test.models.Maker")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            id: { value: 2 },
            name: "a",
            product:
            {
                id: { value: 10 },
                name: "Notebook",
                maker: null
            }
        })
        .commit ()
;
