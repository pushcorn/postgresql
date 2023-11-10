const Id = nit.require ("postgresql.Id");


test.method ("postgresql.Id", "getHashKeys", true)
    .should ("return the registry hash keys")
    .given (new Id (1234))
    .returns ({ value: "1234" })
    .commit ()
;


test.method ("postgresql.Id", "marshall", true)
    .should ("return the marshalled data")
        .given (Id.new (1234))
        .returns ({ value: "1234" })
        .commit ()

    .should ("just return the value if it's not an instance of nit.Object")
        .given ({ value: 1234 })
        .returns ({ value: 1234 })
        .commit ()
;


test.method ("postgresql.Id", "registerTypeMapping", true)
    .should ("add a type mapping to postgresql.TYPE_MAPPINGS")
    .given ("UUID")
    .after (s => s.postgresql = nit.require ("postgresql"))
    .returns (Id)
    .expectingPropertyToContain ("postgresql.TYPE_MAPPINGS", { "postgresql.Id": "UUID" })
    .commit ()
;
