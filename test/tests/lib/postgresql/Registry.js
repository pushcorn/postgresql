test.method ("postgresql.Registry", "lookup")
    .should ("return a derived the model class")
    .defineModel ("test.models.User", User =>
    {
        User
            .field ("<id>", "string")
        ;
    })
    .given ("test.models.User")
    .returnsInstanceOf (Function)
    .expectingPropertyToBe ("result.classChain.length", 6)
    .expecting ("the derived model is cached", s => s.object.lookup ("test.models.User") == s.result)
    .commit ()
;
