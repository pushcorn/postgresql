const MockPgClient = nit.require ("postgresql.mocks.PgClient");
const postgresql = nit.require ("postgresql");

const User = postgresql.defineModel ("test.models.User")
    .field ("<id>", "integer", { key: true })
    .field ("email", "string")
    .field ("addr", "string")
;



test.method ("postgresql.constraints.Unique", "validate", { createArgs: ["email"] })
    .before (s =>
    {
        s.entity = User.new ({ id: 1234, email: "joe@example.com" });
        s.args.push (new User.ValidationContext (
        {
            entity: s.entity,
            constraint: s.object,
            field: User.getField ("email"),
            value: "joe@example.com"
        }));
    })
    .snapshot ()

    .should ("check if the value of the specified field is unique")
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [] };
        })
        .returns (true)
        .commit ()

    .should ("throw if the field value is not unique")
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 5678 }] };
        })
        .throws (/value.*joe@example.*not unique/i)
        .commit ()
;


test.method ("postgresql.constraints.Unique", "validate", { createArgs: ["id", "email"] })
    .should ("throw if the one of the unique field is also the primary key")
        .before (function ()
        {
            this.entity = User.new ({ id: 1234, email: "joe@example.com" });
            this.args.push (new User.ValidationContext (
            {
                entity: this.entity,
                constraint: this.object,
                field: User.getField ("email"),
                value: "joe@example.com"
            }));
        })
        .throws ("error.primary_key_fields_not_allowed")
        .commit ()
;


test.method ("postgresql.constraints.Unique", "validate", { createArgs: ["email", "addr"] })
    .useMockPgClient ()
    .should ("throw if the composite value is not unique")
        .before (function ()
        {
            this.entity = User.new ({ id: 1234, email: "joe@example.com", addr: "address 1" });
            this.args.push (new User.ValidationContext (
            {
                entity: this.entity,
                constraint: this.object,
                field: User.getField ("email"),
                value: "joe@example.com"
            }));
        })
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 5678 }] };
        })
        .throws ("error.value_not_unique")
        .commit ()

    .should ("throw if not all composite keys were provided")
        .defineModel ("test.models.Product", Product =>
        {
            Product
                .defineInnerModel ("Tag", Tag =>
                {
                    Tag
                        .field ("<name>", "string")
                    ;
                })
                .field ("<id>", "string")
                .field ("model", "string")
                .field ("tag", Product.Tag.name)
            ;
        })
        .up (s => s.createArgs = ["model", "tag"])
        .before (s =>
        {
            s.entity = s.Product.new ({ id: 1234, model: "px" });
            s.args.push (new s.Product.ValidationContext (
            {
                entity: s.entity,
                constraint: s.object,
                field: s.Product.getField ("tag")
            }));
        })
        .throws ("error.insufficient_values")
        .commit ()
;


test.method ("postgresql.constraints.Unique", "validate")
    .should ("check the attached field if no fields were specified")
        .before (function ()
        {
            this.entity = User.new ({ id: 1234, email: "joe@example.com" });
            this.args.push (new User.ValidationContext (
            {
                entity: this.entity,
                constraint: this.object,
                field: User.getField ("email"),
                value: "joe@example.com"
            }));
        })
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [] };
        })
        .returns (true)
        .commit ()
;
