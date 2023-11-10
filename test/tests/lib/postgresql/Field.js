test.object ("postgresql.Field")
    .useMockPgClient ()
    .should ("throw if the array field is required")
        .given ("<items...>", { relType: "manyToOne" })
        .throws ("error.required_array_field_not_allowed")
        .commit ()

    .should ("throw if the array field has been marked with manyToOne")
        .given ("items...", { relType: "manyToOne" })
        .throws ("error.invalid_rel_type_for_array_field")
        .commit ()

    .should ("throw if the array field has been marked with oneToOne")
        .given ("items...", { relType: "oneToOne" })
        .throws ("error.invalid_rel_type_for_array_field")
        .commit ()

    .should ("throw if the non-array field has been marked with oneToMany")
        .given ("country", { relType: "oneToMany" })
        .throws ("error.invalid_rel_type_for_non_array_field")
        .commit ()

    .should ("throw if the non-array field has been marked with manyToMany")
        .given ("country", { relType: "manyToMany" })
        .throws ("error.invalid_rel_type_for_non_array_field")
        .commit ()
;


test.object ("postgresql.Field")
    .useMockPgClient ()
    .should ("throw if the field is a key but not required")
        .given ("id", "string", { key: true })
        .throws ("error.optional_key_field")
        .commit ()

    .should ("use the defval as columnDefval if it's not a function")
        .given ("age", "integer", { defval: 10 })
        .expectingPropertyToBe ("result.columnDefval", "10")
        .commit ()

    .should ("not use the defval as columnDefval if it's a function")
        .given ("age", "integer", { defval: () => 10 })
        .expectingPropertyToBe ("result.columnDefval", "")
        .commit ()
;


test.method ("postgresql.Field", "cast")
    .useMockPgClient ()
    .should ("cast a primitive value to the specifed type")
        .up (s => s.createArgs = { spec: "<id>", type: "integer" })
        .given ({}, "100")
        .returns (100)
        .commit ()

    .should ("cast a value to an object with owner class' parser")
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
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "country", type: "test.models.Country" })
        .before (s =>
        {
            s.object = s.Capital.fieldMap.country;
            s.args = [new s.Capital, { id: 10, name: "USA" }];
        })
        .returnsInstanceOf ("test.models.Country")
        .expectingMethodToReturnValue ("result.toPojo", null, { id: "10", name: "USA" })
        .commit ()
;


test.method ("postgresql.Field", "set")
    .useMockPgClient ()
    .should ("set the field value to the given value")
        .defineModel ("test.models.Country")
        .up (s => s.createArgs = { spec: "<id>", type: "integer", key: true })
        .given ("100")
        .mock ("object", "set", function (v)
        {
            const { strategy, target: field, targetMethod } = this;
            const { Country } = strategy;

            field.bind (Country.prototype);

            let country = Object.create (Country.prototype);

            Country.unlock (country);

            strategy.assign ({ owner: country });

            return targetMethod.call (country, v);
        })
        .expectingPropertyToBe ("owner.id", 100)
        .commit ()

    .should ("set the value to a new instance of ID class if the given value is empty")
        .defineModel ("test.models.Country")
        .up (s => s.createArgs = { spec: "<id>", type: "postgresql.ids.Serial", key: true})
        .given ()
        .mock ("object", "set", function (v)
        {
            const { strategy, target: field, targetMethod } = this;
            const { Country } = strategy;

            field.constructor.outerClass = Country;
            field.bind (Country.prototype);

            let country = Object.create (Country.prototype);

            Country.unlock (country);

            strategy.assign ({ owner: country });

            return targetMethod.call (country, v);
        })
        .after (s => delete s.class.outerClass)
        .expectingPropertyToBeOfType ("owner.id", "postgresql.ids.Serial")
        .expectingPropertyToBe ("owner.id.value", "")
        .commit ()
;


test.method ("postgresql.Field", "columnNameFor")
    .useMockPgClient ()
    .should ("generate the column name for the given ancestors")
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
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<id>", type: "string", key: true })
        .before (s => s.args = s.Capital.fieldMap.country)
        .returns ("country_id")
        .commit ()
;


test.method ("postgresql.Field", "columnTypeFor")
    .should ("return the db type for the current field type")
        .up (s => s.createArgs = { spec: "<id>", type: "postgresql.ids.Serial", key: true })
        .returns ("SERIAL")
        .commit ()

    .can ("return a different db type for a reference field")
        .up (s => s.createArgs = { spec: "<id>", type: "postgresql.ids.Serial", key: true })
        .given ({ reference: true })
        .returns ("INTEGER")
        .commit ()
;


test.method ("postgresql.Field", "bind")
    .useMockPgClient ()
        .should ("throw if the target is not an instance of postgresql.Model")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .up (s => s.createArgs = { spec: "<id>", type: "postgresql.ids.Serial", key: true })
        .up (s => s.class = s.db.lookup ("test.models.Country").Field)
        .given ({})
        .throws ("error.invalid_bind_target")
        .commit ()
;


test.method ("postgresql.Field", "marshall")
    .useMockPgClient ()
    .should ("convert a model value into the primary key values")
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
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("<country>", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<country>", type: "test.models.Country" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital, Country }) =>
        {
            let country = Country.new ("1234", "USA");
            let capital = Capital.new ("234", "Washington D.C.", country);
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ country, capital, row });
        })
        .expectingPropertyToBe ("row", { country_id: "1234" })
        .expectingPropertyToBeOfType ("Capital.fieldMap.country.relationship", "postgresql.Relationship")
        .expectingPropertyToBeOfType ("Capital.fieldMap.country.relationshipPath", "postgresql.RelationshipPath")
        .commit ()

    .should ("skip the empty model value")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<country>", type: "test.models.Country" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("234", "Washington D.C.");
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBe ("row", {})
        .commit ()

    .should ("convert an ID value to a primitive value")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<id>", type: "postgresql.ids.BigSerial" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("2345", "Washington D.C.");
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBe ("row", { id: "2345" })
        .commit ()

    .should ("convert the inner model into on or more column values")
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
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.", { stats: { population: 689545, airports: 5 } });
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBe ("row", { stats_population: 689545, stats_airports: 5 })
        .commit ()

    .should ("skip the empty inner model")
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
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.");
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBe ("row", {})
        .commit ()

    .should ("convert an inner object into a pojo")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerClass ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.", { stats: { population: 689545, airports: 5 } });
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBe ("row", { stats: { population: 689545, airports: 5 } })
        .commit ()

    .should ("clone a primitive value")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerClass ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "object")
            ;
        })
        .up (s => s.createArgs = { spec: "stats", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.", { stats: { population: 689545, airports: 5 } });
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBeOfType ("row.stats", "Object")
        .expectingPropertyToBe ("row", { stats: { population: 689545, airports: 5 } })
        .commit ()

    .should ("be able to marshall a non-model array field")
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
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("stats...", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats...", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.", { stats: [{ year: 2002, population: 689545, airports: 5 }, { year: 1000, population: 2, airports: 1 }] });
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBeOfType ("row.stats", "arr")
        .expectingPropertyToBe ("row", { stats: [{ year: 2002, population: 689545, airports: 5 }, { year: 1000, population: 2, airports: 1 }] })
        .commit ()

    .should ("be able to marshall an inner-model array field")
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
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("stats...", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats...", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.", { stats: [{ year: 2002, population: 689545, airports: 5 }, { year: 1000, population: 2, airports: 1 }] });
            let row = {};

            self.args = [capital, row, new Capital.ActionContext];

            field.bind (Capital.prototype);
            self.assign ({ capital, row });
        })
        .expectingPropertyToBeOfType ("row.stats", "arr")
        .expectingPropertyToBe ("row", { stats: [{ year: 2002, population: 689545, airports: 5 }, { year: 1000, population: 2, airports: 1 }] })
        .commit ()

    .should ("be able to marshall an external-model array field")
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag")
            ;
        })
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("products...", "test.models.Product")
            ;
        })
        .up (s => s.createArgs = { spec: "tags...", type: "test.models.Tag" })
        .up (s => s.class = s.db.lookup ("test.models.Product").Field)
        .before (({ self, object: field, Product }) =>
        {
            let product = Product.new (1, "Notebook", { tags: [{ id: 2, name: "a" }, { id: 3, name: "b" }] });
            let row = {};

            self.args = [product, row, new Product.ActionContext];

            field.bind (Product.prototype);
            self.assign ({ product, row });
        })
        .expectingPropertyToBeOfType ("row.tags", "arr")
        .expectingPropertyToBe ("row", { tags: [{ id: 2 }, { id: 3 }] })
        .commit ()
;


test.method ("postgresql.Field", "unmarshall")
    .useMockPgClient ()
    .should ("convert row values into model values")
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
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<country>", type: "test.models.Country" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("234", "Washington D.C.");
            let row = { country_id: "1234" };

            self.args = [row, capital, new Capital.QueryOptions];

            field.bind (Capital.prototype);
            self.assign ({ model: capital, row });
        })
        .expectingPropertyToBeOfType ("model.country", "test.models.Country")
        .expectingPropertyToBe ("model.country.id", "1234")
        .expectingPropertyToBe ("model.country.name", "")
        .commit ()

    .should ("skip empty row values for a model property")
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
                .field ("<id>", "string", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<country>", type: "test.models.Country" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("234", "Washington D.C.");
            let row = {};

            self.args = [row, capital, new Capital.QueryOptions];

            field.bind (Capital.prototype);
            self.assign ({ model: capital, row });
        })
        .expectingPropertyToBe ("model.country", undefined)
        .commit ()

    .should ("be able to build an ID field from row data")
        .defineModel ("test.models.Country", Country =>
        {
            Country
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .up (s => s.createArgs = { spec: "<id>", type: "postgresql.ids.BigSerial" })
        .up (s => s.class = s.db.lookup ("test.models.Country").Field)
        .before (({ self, object: field, Country }) =>
        {
            let country = new Country;
            let row = { id: "234" };

            self.args = [row, country, new Country.QueryOptions];

            field.bind (Country.prototype);
            self.assign ({ model: country, row });
        })
        .expectingPropertyToBeOfType ("model.id", "postgresql.ids.BigSerial")
        .expectingPropertyToBe ("model.id.value", "234")
        .commit ()

    .should ("restore the inner model from the row data")
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
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.");
            let row = { stats_population: 689545, stats_airports: 5 };

            self.args = [row, capital, new Capital.QueryOptions];

            field.bind (Capital.prototype);
            self.assign ({ model: capital, row });
        })
        .expectingPropertyToBeOfType ("model.stats", "test.models.Capital.Stats")
        .expectingPropertyToBe ("model.stats.population", 689545)
        .expectingPropertyToBe ("model.stats.airports", 5)
        .commit ()

    .should ("restore a non-model object from the row data")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .defineInnerClass ("Stats", Stats =>
                {
                    Stats
                        .field ("population", "integer")
                        .field ("airports", "integer")
                    ;
                })
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
                .field ("stats", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new ("222", "Washington D.C.");
            let row = { stats: { population: 689545, airports: 5 } };

            self.args = [row, capital, new Capital.QueryOptions];

            Capital.unlock (capital);
            field.bind (Capital.prototype);
            self.assign ({ model: capital, row });
        })
        .expectingPropertyToBeOfType ("model.stats", "test.models.Capital.Stats")
        .expectingPropertyToBe ("model.stats.population", 689545)
        .expectingPropertyToBe ("model.stats.airports", 5)
        .commit ()

    .should ("restore a primitive value")
        .defineModel ("test.models.Capital", Capital =>
        {
            Capital
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
                .field ("<name>", "string")
                .field ("country", "test.models.Country")
            ;
        })
        .up (s => s.createArgs = { spec: "<name>", type: "string" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = new Capital;
            let row = { name: "Washington D.C." };

            self.args = [row, capital, new Capital.QueryOptions];

            field.bind (Capital.prototype);
            self.assign ({ model: capital, row });
        })
        .expectingPropertyToBe ("model.name", "Washington D.C.")
        .commit ()

    .should ("restore an extra model")
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
        .up (s => s.createArgs = { spec: "extra", type: "test.models.ActivityPerformer.Extra" })
        .up (s => s.class = s.db.lookup ("test.models.Performer").Field)
        .before (({ self, object: field, Performer }) =>
        {
            let performer = Performer.new (1, "John Doe");
            let row = { extra: { displayOrder: 1, status: "a" } };

            self.args = [row, performer, new Performer.QueryOptions];

            field.bind (Performer.prototype);
            self.assign ({ model: performer, row });
        })
        .expectingPropertyToBeOfType ("model.extra", "test.models.ActivityPerformer.Extra")
        .expectingPropertyToBe ("model.extra.displayOrder", 1)
        .expectingPropertyToBe ("model.extra.status", "a")
        .commit ()

    .should ("skip the empty value for the extra model")
        .up (s => s.createArgs = { spec: "extra", type: "test.models.ActivityPerformer.Extra" })
        .up (s => s.class = s.db.lookup ("test.models.Performer").Field)
        .before (({ self, object: field, Performer }) =>
        {
            let performer = Performer.new (1, "John Doe");
            let row = { extra: null };

            self.args = [row, performer, new Performer.QueryOptions];

            field.bind (Performer.prototype);
            self.assign ({ model: performer, row });
        })
        .expectingPropertyToBe ("model.extra", undefined)
        .commit ()

    .should ("be able to restore an inner-model array field")
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
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("stats...", "test.models.Capital.Stats")
            ;
        })
        .up (s => s.createArgs = { spec: "stats...", type: "test.models.Capital.Stats" })
        .up (s => s.class = s.db.lookup ("test.models.Capital").Field)
        .before (({ self, object: field, Capital }) =>
        {
            let capital = Capital.new (1, "Taipei");
            let row = { stats: [{ year: 2002, population: 689545, airports: 5 }, { year: 1000, population: 2, airports: 1 }] };

            self.args = [row, capital, new Capital.QueryOptions];

            field.bind (Capital.prototype);
            self.assign ({ model: capital, row });
        })
        .expectingPropertyToBeOfType ("model.stats.0", "test.models.Capital.Stats")
        .expectingPropertyToBeOfType ("model.stats.1", "test.models.Capital.Stats")
        .expectingMethodToReturnValue ("model.stats.0.toPojo", null, { year: 2002, population: 689545, airports: 5 })
        .expectingMethodToReturnValue ("model.stats.1.toPojo", null, { year: 1000, population: 2, airports: 1 })
        .commit ()

    .should ("be able to restore an array field")
        .defineModel ("test.models.Book", Book =>
        {
            Book
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "string")
            ;
        })
        .up (s => s.createArgs = { spec: "tags...", type: "string" })
        .up (s => s.class = s.db.lookup ("test.models.Book").Field)
        .before (({ self, object: field, Book }) =>
        {
            let book = Book.new (1, "JavaScript", { tags: ["c"] });
            let row = { tags: ["a", "b", "b"] };

            self.args = [row, book, new Book.QueryOptions];

            field.bind (Book.prototype);
            self.assign ({ model: book, row });
        })
        .expectingPropertyToBe ("model.tags", ["a", "b", "b"])
        .commit ()

    .should ("be able to restore an array field")
        .defineModel ("test.models.Tag", Tag =>
        {
            Tag
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
            ;
        })
        .defineModel ("test.models.Book", Book =>
        {
            Book
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tags...", "test.models.Tag")
            ;
        })
        .up (s => s.createArgs = { spec: "tags...", type: "test.models.Tag" })
        .up (s => s.class = s.db.lookup ("test.models.Book").Field)
        .before (({ self, object: field, Book }) =>
        {
            let book = Book.new (1, "JavaScript", { tags: [{ tags_id: 2, name: "c" }] });
            let row = { tags: [{ tags_id: 3, name: "a" }, { tags_id: 4, name: "b" }, { tags_id: 4, name: "b" }] };

            self.args = [row, book, new Book.QueryOptions];

            field.bind (Book.prototype);
            self.assign ({ model: book, row });
        })
        .expectingPropertyToBe ("model.tags.length", 2)
        .expectingPropertyToBeOfType ("model.tags.0", "test.models.Tag")
        .expectingPropertyToBeOfType ("model.tags.1", "test.models.Tag")
        .expectingMethodToReturnValue ("model.tags.0.toPojo", null, { id: 3, name: "" })
        .expectingMethodToReturnValue ("model.tags.1.toPojo", null, { id: 4, name: "" })
        .commit ()

    .should ("skip a model field if the object is empty")
        .defineModel ("test.models.Book", Book =>
        {
            Book
                .defineInnerModel ("Tag", Tag =>
                {
                    Tag
                        .field ("<name>", "string")
                    ;
                })
                .field ("<id>", "integer", { key: true })
                .field ("<name>", "string")
                .field ("tag", Book.Tag.name)
            ;
        })
        .up (s => s.createArgs = { spec: "tag", type: "test.models.Book.Tag" })
        .up (s => s.class = s.db.lookup ("test.models.Book").Field)
        .before (({ self, object: field, Book }) =>
        {
            let book = Book.new (1, "JavaScript");
            let row = { tag_name: undefined };

            self.args = [row, book, new Book.QueryOptions];

            field.bind (Book.prototype);
            self.assign ({ model: book, row });
        })
        .expectingPropertyToBe ("model.tag", undefined)
        .commit ()
;
