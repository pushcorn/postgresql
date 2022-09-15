const MockPgClient = nit.require ("postgresql.MockPgClient");
const postgresql = nit.require ("postgresql");

const User = postgresql.defineModel ("test.models.User")
    .field ("<id>", "integer", { key: true })
    .field ("groupId", "integer")
    .field ("newPassword", "string", { transient: true })
;

const DummyTransform = postgresql.defineTransform ("Dummy");


test.method (User, "get", true)
    .should ("search the databae and retrun a single item that matches the given key(s)")
        .given (1)
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [] };
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /select.*from.*user.*where "id" = '1'/is)
        .commit ()
;


test.method (User, "find", true)
    .should ("return the first item that matches the searching criteria")
        .given ({ id: 2 })
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 2 }] };
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /select.*from.*user.*where "id" = '2'/is)
        .expectingMethodToReturnValue ("result.toPojo", { id: 2, groupId: 0, newPassword: "" })
        .commit ()
;


test.method (User, "select", true)
    .should ("return the items that match the searching criteria")
        .given ({ groupId: 3, invalidField: 10 }, ["AND age > 15"])
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 2 }, { id: 4 }] };
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /select.*from.*user.*where.*age > 15/is)
        .expectingPropertyToBe ("result.length", 2)
        .expectingPropertyToBeOfType ("result.0", User)
        .expectingPropertyToBe ("result.0.id", 2)
        .expectingPropertyToBeOfType ("result.1", User)
        .expectingPropertyToBe ("result.1.id", 4)
        .commit ()
;


let user;

test.method (User, "load", true)
    .should ("load the model data from the database")
        .given (user = User.create ({ id: 2 }))
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 2, groupId: 9 }] };
        })
        .returns (user)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /select.*from.*user.*where "id" = '2'/is)
        .expectingPropertyToBe ("result.groupId", 9)
        .commit ()

    .should ("return a new model if given a pojo")
        .given ({ id: 2 })
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [{ id: 2, groupId: 9 }] };
        })
        .returnsInstanceOf (User)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /select.*from.*user.*where "id" = '2'/is)
        .expectingPropertyToBe ("result.groupId", 9)
        .commit ()

    .should ("throw if the model was not found in the database")
        .given (user = User.create ({ id: 2 }))
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { rows: [] };
        })
        .throws ("error.entity_not_found")
        .commit ()
;


test.method (User, "save", true)
    .should ("save the model to the database")
        .given (user = User.create ({ id: 2, groupId: 10 }))
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { command: "INSERT" };
        })
        .returns (user)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /insert into.*user.*"groupId" = '10'/is)
        .commit ()

    .should ("return a new model after save if a pojo was given")
        .given ({ id: 2, groupId: 10 })
        .mock (MockPgClient.prototype, "query", function ()
        {
            return { command: "INSERT" };
        })
        .returnsInstanceOf (User)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /insert into.*user.*"groupId" = '10'/is)
        .expectingPropertyToBe ("result.groupId", 10)
        .commit ()
;



let arg;

test.method (User, "unmarshall", true)
    .should ("turn the row data into an instance of model")
        .given (arg = { id: 2, groupId: 10 })
        .before (function ()
        {
            User.transforms.push (this.trans = new DummyTransform ());
        })
        .mock ("trans", "preUnmarshall")
        .mock ("trans", "postUnmarshall")
        .returnsInstanceOf (User)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.0", User)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1", arg)
        .expectingPropertyToBeOfType ("mocks.1.invocations.0.args.0", User)
        .expectingPropertyToBe ("mocks.1.invocations.0.args.1", arg)
        .commit ()
;


test.method (User, "marshall", true)
    .should ("convert the model into the row data")
        .given (User.create ({ id: 2, groupId: 10 }))
        .before (function ()
        {
            let st = this;

            User.transforms[0] = st.trans = new DummyTransform ();

            nit.dpv (st.trans, "preMarshall", function (model, row)
            {
                st.preMarshallRow = nit.clone (row);
            });
        })
        .mock ("trans", "preMarshall")
        .mock ("trans", "postMarshall")
        .returns ({ id: 2, groupId: 10 })
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBe ("preMarshallRow", {})
        .expectingPropertyToBeOfType ("mocks.1.invocations.0.args.0", User)
        .expectingPropertyToBe ("mocks.1.invocations.0.args.1", { id: 2, groupId: 10 })
        .commit ()
;


test.object (postgresql.Model)
    .should ("provide a default database via a static property")
        .expectingPropertyToBeOfType ("object.db", "postgresql.Database")
        .commit ()
;


let dbId;

test.object (new User.ValidationContext)
    .should ("provide a default database")
        .expectingPropertyToBeOfType ("object.db", "postgresql.Database")
        .commit ()

    .should ("use the db from the owner's model class if available")
        .before (function ()
        {
            User.db = new postgresql.Database;
            User.db.id = dbId = nit.uuid ();
        })
        .expectingPropertyToBe ("object.db.id", dbId)
        .commit ()
;
