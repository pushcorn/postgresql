const MockPgClient = nit.require ("postgresql.MockPgClient");
const postgresql = nit.require ("postgresql");

const User = postgresql.defineModel ("test.models.User")
    .field ("<id>", "integer", { key: true })
    .field ("email", "string")
;



test.method ("postgresql.constraints.Unique", "validate", { createArgs: ["email"] })
    .before (function ()
    {
        this.model = User.create ({ id: 1234, email: "joe@example.com" });
        this.args.push (new User.ValidationContext (
        {
            model: this.model,
            constraint: this.object,
            field: User.getField ("email"),
            value: this.args[0]
        }));
    })
    .snapshot ()

    .should ("check if the value of the specified field is unique")
        .given ("joe@example.com")
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [] };
        })
        .returns (true)
        .commit ()

    .should ("throw if the field value is not unique")
        .given ("joe@example.com")
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 5678 }] };
        })
        .throws (/value.*joe@example.*not unique/i)
        .commit ()
;


test.method ("postgresql.constraints.Unique", "validate", { createArgs: ["id", "email"] })
    .should ("throw if the composite value is not unique")
        .before (function ()
        {
            this.model = User.create ({ id: 1234, email: "joe@example.com" });
            this.args.push (new User.ValidationContext (
            {
                model: this.model,
                constraint: this.object,
                field: User.getField ("email")
            }));
        })
        .given ("joe@example.com")
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 1234 }] };
        })
        .throws (/value.*id.*1234.*joe@example.*not unique/i)
        .commit ()
;


test.method ("postgresql.constraints.Unique", "validate")
    .should ("check the attached field if no fields were specified")
        .before (function ()
        {
            this.model = User.create ({ id: 1234, email: "joe@example.com" });
            this.args.push (new User.ValidationContext (
            {
                model: this.model,
                constraint: this.object,
                field: User.getField ("email")
            }));
        })
        .given ("joe@example.com")
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [] };
        })
        .returns (true)
        .commit ()
;
