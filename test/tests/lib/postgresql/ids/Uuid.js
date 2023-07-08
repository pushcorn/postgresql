test.method ("postgresql.ids.Uuid", "marshall", true)
    .useMockPgClient ()

    .should ("generate an ID when inserting a row")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.Uuid", { key: true })
            ;
        })
        .before (({ self, class: Uuid, User }) =>
        {
            self.args = [Uuid.new (""), new User.ActionContext ("insert"), User.fieldMap.id];
        })
        .mock ("class.db", "value", () => "72133cfb-c1b3-4bf9-a4cf-819f2ee24cee")
        .returns ({ value: "72133cfb-c1b3-4bf9-a4cf-819f2ee24cee" })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", `SELECT UUID_GENERATE_V4 ()`)
        .commit ()

    .should ("return marshalled object for non-insert actions")
        .before (({ self, class: Uuid, User }) =>
        {
            self.args = [Uuid.new (""), new User.ActionContext ("update"), User.fieldMap.id];
        })
        .returns ({ value: "" })
        .commit ()
;


test.custom ("Class: postgresql.ids.Uuid")
    .should ("register a type mapping for Uuid")
    .task (({ postgresql }) => (
    {
        nonReferenceType: postgresql.dbTypeFor ("postgresql.ids.Uuid"),
        referenceType: postgresql.dbTypeFor ("postgresql.ids.Uuid", { reference: true })
    }))
    .returns ({ nonReferenceType: "UUID", referenceType: "UUID" })
    .commit ()
;
