test.method ("postgresql.Model", "save")
    .useMockDatabase ()
    .should ("save an entity to the database")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .before (s =>
        {
            s.object = s.User.new (123, "John Doe");
        })
        .expectingMethodToReturnValue ("db.select", "users", [{ id: 123, name: "John Doe" }])
        .expecting ("the same entity will not be updated if saved again", true, async (s) =>
        {
            s.object.name = "Jane Doe";

            return (await s.object.save ()) instanceof s.User;
        })
        .expectingMethodToReturnValue ("db.select", "users", [{ id: 123, name: "Jane Doe" }])
        .commit ()

    .should ("update the entity if can be loaded with unique key(s)")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("<email>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .before (async (s) =>
        {
            await s.User.new (123, "John Doe", "jd@exp.com").save ();

            s.object = s.User.new ("", "Jane Doe", "jd@exp.com");
        })
        .expectingMethodToReturnValue ("db.select", "users", [{ id: 123, name: "Jane Doe", email: "jd@exp.com" }])
        .commit ()

    .should ("use the primary key(s) from the entity found by the unique key(s)")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("<email>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .before (async (s) =>
        {
            await s.User.new (123, "John Doe", "jd@exp.com").save ();

            s.object = s.User.new (456, "Jane Doe", "jd@exp.com");
        })
        .expectingMethodToReturnValue ("db.select", "users", [{ id: 123, name: "Jane Doe", email: "jd@exp.com" }])
        .commit ()

    .should ("update the entity if can be loaded with primary key(s)")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "postgresql.ids.Serial", { key: true })
                .field ("<name>", "string")
                .field ("<email>", "string")
                    .constraint ("postgresql:unique")
            ;
        })
        .before (async (s) =>
        {
            await s.User.new (456, "John Doe", "jd@exp.com").save ();

            s.object = s.User.new (456, "Jane Doe", "jd@exp.com");
        })
        .expectingMethodToReturnValue ("db.select", "users", [{ id: 456, name: "Jane Doe", email: "jd@exp.com" }])
        .commit ()
;
