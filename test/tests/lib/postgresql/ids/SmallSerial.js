test.method ("postgresql.ids.SmallSerial", "marshall", true)
    .useMockPgClient ()

    .should ("generate an ID when inserting a row")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.SmallSerial", { key: true })
            ;
        })
        .before (({ self, class: SmallSerial, User }) =>
        {
            self.args = [SmallSerial.new (""), new User.ActionContext ("insert"), User.fieldMap.id];
        })
        .mock ("class.db", "value", () => 2)
        .returns ({ value: 2 })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", `SELECT NEXTVAL (PG_GET_SERIAL_SEQUENCE ('"test_users"', 'id'))`)
        .commit ()

    .should ("return marshalled object for non-insert actions")
        .before (({ self, class: SmallSerial, User }) =>
        {
            self.args = [SmallSerial.new (""), new User.ActionContext ("update"), User.fieldMap.id];
        })
        .returns ({ value: "" })
        .commit ()
;


test.custom ("Class: postgresql.ids.SmallSerial")
    .should ("register a type mapping for SmallSerial")
    .task (({ postgresql }) =>
    ({
        nonReferenceType: postgresql.dbTypeFor ("postgresql.ids.SmallSerial"),
        referenceType: postgresql.dbTypeFor ("postgresql.ids.SmallSerial", { reference: true })
    }))
    .returns ({ nonReferenceType: "SMALLSERIAL", referenceType: "SMALLINT" })
    .commit ()
;
