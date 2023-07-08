test.method ("postgresql.ids.BigSerial", "marshall", true)
    .useMockPgClient ()

    .should ("generate an ID when inserting a row")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.BigSerial", { key: true })
            ;
        })
        .before (({ self, class: BigSerial, User }) =>
        {
            self.args = [BigSerial.new (""), new User.ActionContext ("insert"), User.fieldMap.id];
        })
        .mock ("class.db", "value", () => "2")
        .returns ({ value: "2" })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", `SELECT NEXTVAL (PG_GET_SERIAL_SEQUENCE ('"users"', 'id'))`)
        .commit ()

    .should ("return marshalled object for non-insert actions")
        .before (({ self, class: BigSerial, User }) =>
        {
            self.args = [BigSerial.new (""), new User.ActionContext ("update"), User.fieldMap.id];
        })
        .returns ({ value: "" })
        .commit ()
;


test.custom ("Class: postgresql.ids.BigSerial")
    .should ("register a type mapping for BigSerial")
    .task (({ postgresql }) =>
    ({
        nonReferenceType: postgresql.dbTypeFor ("postgresql.ids.BigSerial"),
        referenceType: postgresql.dbTypeFor ("postgresql.ids.BigSerial", { reference: true })
    }))
    .returns ({ nonReferenceType: "BIGSERIAL", referenceType: "BIGINT" })
    .commit ()
;
