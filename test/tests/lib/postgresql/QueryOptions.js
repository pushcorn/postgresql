const postgresql = nit.require ("postgresql");
const QueryOptions = nit.require ("postgresql.QueryOptions");

const User = postgresql.defineModel ("test.models.User")
    .field ("<id>", "string", { key: true })
    .field ("firstname", "string")
    .field ("lastname", "string")
;


test.method ("postgresql.QueryOptions.EntitySet", "lookup")
    .should ("lookup an entity using its hash keys")
        .given (User, { id: 3 })
        .returns ()
        .commit ()

    .before (s => s.object.entities.push (User.new (4)))
        .given (User, { id: 4 })
        .returnsInstanceOf (User)
        .expectingPropertyToBe ("result.id", "4")
        .commit ()

    .given (User)
        .returns ()
        .commit ()
;


test.method ("postgresql.QueryOptions.EntitySet", "tagFor")
    .should ("return the associated object of the given enity")
        .given (User.new (4))
        .before (s => s.object.find (s.args[0]))
        .returnsInstanceOf (Object)
        .commit ()
;


test.method ("postgresql.QueryOptions.EntitySet", "find")
    .should ("return false if the entity was not added")
        .given (User.new (4))
        .returns (false)
        .commit ()

    .should ("return the existing entity that matches the hash keys of the given entity")
        .given (User.new (4, { firstname: "John" }))
        .before (s => s.object.find (User.new (4, { firstname: "Jane" })))
        .returnsInstanceOf (User)
        .expectingPropertyToBe ("result.firstname", "Jane")
        .commit ()
;


test.object ("postgresql.QueryOptions.Entities")
    .should ("have 3 fields hosting different types of entity sets")
    .expectingPropertyToBeOfType ("result.processed", "postgresql.QueryOptions.EntitySet")
    .expectingPropertyToBeOfType ("result.marshalled", "postgresql.QueryOptions.EntitySet")
    .expectingPropertyToBeOfType ("result.unmarshalled", "postgresql.QueryOptions.EntitySet")
    .commit ()
;


test.method ("postgresql.QueryOptions", "eager", true)
    .should ("clone the given options and set eager field to true")
    .given (new QueryOptions ({ eager: false, cascade: true }))
    .before (s =>
    {
        s.args[0].entities.marshalled.find (User.new (5));
    })
    .returnsInstanceOf (QueryOptions)
    .expectingMethodToReturnValueContaining ("result.toPojo", null, { eager: true, cascade: false })
    .expectingPropertyToBe ("result.entities.marshalled.entities.length", 1)
    .expectingMethodToReturnValueContaining ("result.entities.marshalled.entities.0.toPojo", null, { id: "5" })
    .commit ()
;


test.method ("postgresql.QueryOptions", "lazy", true)
    .should ("clone the given options and set eager field to false")
    .given (new QueryOptions ({ eager: true, cascade: true }))
    .before (s =>
    {
        s.args[0].entities.marshalled.find (User.new (5));
    })
    .returnsInstanceOf (QueryOptions)
    .expectingMethodToReturnValueContaining ("result.toPojo", null, { eager: false, cascade: false })
    .expectingPropertyToBe ("result.entities.marshalled.entities.length", 1)
    .expectingMethodToReturnValueContaining ("result.entities.marshalled.entities.0.toPojo", null, { id: "5" })
    .commit ()
;


test.method ("postgresql.QueryOptions", "cascade", true)
    .should ("clone the given options and set cascade field to true")
    .given (new QueryOptions ({ eager: true, cascade: false }))
    .before (s =>
    {
        s.args[0].entities.marshalled.find (User.new (5));
    })
    .returnsInstanceOf (QueryOptions)
    .expectingMethodToReturnValueContaining ("result.toPojo", null, { eager: false, cascade: true })
    .expectingPropertyToBe ("result.entities.marshalled.entities.length", 1)
    .expectingMethodToReturnValueContaining ("result.entities.marshalled.entities.0.toPojo", null, { id: "5" })
    .commit ()
;


test.method ("postgresql.QueryOptions", "clone", true)
    .should ("clone only the entities of the given options")
    .given (new QueryOptions ({ eager: true, cascade: true }))
    .before (s =>
    {
        s.args[0].entities.marshalled.find (User.new (5));
    })
    .returnsInstanceOf (QueryOptions)
    .expectingMethodToReturnValueContaining ("result.toPojo", null, { eager: false, cascade: false })
    .expectingPropertyToBe ("result.entities.marshalled.entities.length", 1)
    .expectingMethodToReturnValueContaining ("result.entities.marshalled.entities.0.toPojo", null, { id: "5" })
    .commit ()
;


test.object ("postgresql.QueryOptions", true, "relationshipMap")
    .should ("contain the relationships indexed by path")
    .given (
    {
        relationships:
        {
            path: "User.friends",
            alias: "f"
        }
    })
    .returnsResultContaining (
    {
        "User.friends":
        {
            path: "User.friends",
            alias: "f"
        }
    })
    .commit ()
;
