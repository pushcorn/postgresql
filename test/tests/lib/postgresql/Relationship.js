test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("return undefined if the field type is not an external model")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .before (s => s.args.push (s.Country.fieldMap.id))
        .returns ()
        .commit ()

    .should ("create a new relationship descriptor if the field type is a model")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.localClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.remoteClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField", undefined)
        .expectingPropertyToBe ("result.remoteField", undefined)
        .expectingPropertyToBe ("result.ownerColumns", ["country_id"])
        .expectingPropertyToBe ("result.referencedColumns", ["id"])
        .expectingPropertyToBe ("result.joinModelName", undefined)
        .expectingPropertyToBe ("result.joinModelClass", undefined)
        .expectingPropertyToBe ("Country.fieldMap.name.relationship", undefined)
        .expectingPropertyToBeOfType ("Capital.fieldMap.country.relationship", "postgresql.Relationship")
        .expectingPropertyToBe ("Country.fieldMap.name.unique", true)
        .expectingPropertyToBe ("Country.fieldMap.name.typeIsModel", false)
        .expectingPropertyToBe ("Capital.fieldMap.country.typeIsModel", true)
        .commit ()

    .should ("throw if the owner field has mappedBy")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country", { mappedBy: "capital" })
            ;
        })
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .throws ("error.owner_mapped_by_not_allowed")
        .commit ()

    .should ("throw if the optional owner field has mappedBy")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country", { mappedBy: "capital" })
            ;
        })
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .throws ("error.owner_mapped_by_not_allowed")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("throw if fields on both sides have mappedBy specified")
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
                .field ("<country>", "test.models.Country", { mappedBy: "capital" })
            ;
        })
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .throws ("error.mapped_by_conflict")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make the field without mappedBy the relationship owner")
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
        .before (s => s.args.push (s.Country.fieldMap.capital))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField.name", "capital")
        .expectingPropertyToBe ("result.remoteField.name", "country")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make the field without mappedBy the relationship owner")
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
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField.name", "capital")
        .expectingPropertyToBe ("result.remoteField.name", "capital")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("throw if both fields are required")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("<capital>", "test.models.Capital")
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
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .throws ("error.required_field_conflict")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make the field of the class whose simple name is sorted first the owner field if both fields are optional")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital")
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField.name", "capital")
        .expectingPropertyToBe ("result.remoteField.name", "capital")
        .commit ()

    .reset ()
        .before (s => s.args.push (s.Country.fieldMap.capital))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField.name", "capital")
        .expectingPropertyToBe ("result.remoteField.name", "country")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make the required field the owner of the relationship if the other field is optional")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital")
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
        .before (s => s.args.push (s.Capital.fieldMap.country))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField.name", "capital")
        .expectingPropertyToBe ("result.remoteField.name", "capital")
        .commit ()

    .reset ()
        .before (s => s.args.push (s.Country.fieldMap.capital))
        .returnsInstanceOf ("postgresql.Relationship")
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Capital")
        .expectingPropertyToBe ("result.ownerField.name", "country")
        .expectingPropertyToBe ("result.referencedClass.name", "test.models.Country")
        .expectingPropertyToBe ("result.referencedField.name", "capital")
        .expectingPropertyToBe ("result.remoteField.name", "country")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("throw if the referenced field is required")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("<capital>", "test.models.Capital", { mappedBy: "country" })
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .before (s => s.args.push (s.Country.fieldMap.capital))
        .throws ("error.required_referenced_field")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("throw if the mappedBy refers an invalid field")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
                .field ("capital", "test.models.Capital")
            ;
        })
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country", { mappedBy: "capital2" })
            ;
        })
        .before (s => s.args.push (s.Country.fieldMap.capital))
        .throws ("error.invalid_mapped_by")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make non-array field the owner of the relationship")
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
        .before (s => s.args.push (s.Order.fieldMap.items))
        .expectingPropertyToBe ("args.0.relType", "oneToMany")
        .expectingPropertyToBe ("result.ownerField.name", "order")
        .commit ()

    .reset ()
        .before (s => s.args.push (s.OrderItem.fieldMap.order))
        .expectingPropertyToBe ("args.0.relType", "manyToOne")
        .expectingPropertyToBe ("result.ownerField.name", "order")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("throw if the owner field is an array")
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
                .field ("order", "test.models.Order", { mappedBy: "items" })
                .field ("total", "integer",
                {
                    getter: function ()
                    {
                        return this.unitPrice * this.quantity;
                    }
                })
            ;
        })
        .before (s => s.args.push (s.Order.fieldMap.items))
        .throws ("error.array_owner_field_not_allowed")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make non-array field the owner of the relationship")
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
                .field ("total", "integer",
                {
                    getter: function ()
                    {
                        return this.unitPrice * this.quantity;
                    }
                })
            ;
        })
        .before (s => s.args.push (s.Order.fieldMap.items))
        .returnsInstanceOf ("postgresql.Relationship")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("make the field of the class whose simple name is sorted first the owner field if both fields are array")
        .defineModel ("test.models.Student", Student =>
        {
            Student
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("classes...", "test.models.Class")
            ;
        })
        .defineModel ("test.models.Class", Class =>
        {
            Class
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<title>", "string")
                .field ("students...", "test.models.Student")
            ;
        })
        .before (s => s.args.push (s.Student.fieldMap.classes))
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Class")
        .expectingPropertyToBe ("result.ownerField.name", "students")
        .expectingPropertyToBe ("result.joinModelName", "test.models.ClassStudentsStudentClassesLink")
        .expectingPropertyToBe ("result.joinModelClass.name", "test.models.ClassStudentsStudentClassesLink")
        .expectingPropertyToBe ("Class.fieldMap.students.relationship.joinModelClass.name", "test.models.ClassStudentsStudentClassesLink")
        .commit ()

    .reset ()
        .before (s => s.args.push (s.Class.fieldMap.students))
        .expectingPropertyToBe ("result.ownerClass.name", "test.models.Class")
        .expectingPropertyToBe ("result.ownerField.name", "students")
        .commit ()
;


test.method ("postgresql.Relationship", "new", true)
    .useMockPgClient ()
    .should ("support a many-to-many relationship without the referenced field")
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
            ;
        })
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag", { relType: "manyToMany" })
            ;
        })
        .before (s => s.args.push (s.Product.fieldMap.tags))
        .expectingPropertyToBe ("result.referencedField", undefined)
        .expectingPropertyToBe ("result.joinModelName", "test.models.ProductTagsTagProductsLink")
        .expectingPropertyToBeOfType ("result.joinModelClass", "function")
        .expectingPropertyToBe ("result.joinModelClass.primaryKeyNames", ["product", "tag"])
        .commit ()
;
