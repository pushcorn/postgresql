test.method ("postgresql.Job", "nit.Object.caster", true)
    .should ("support casting of models.Job")
        .given (nit.lookupClass ("postgresql.models.Job").new (nit.uuid (), "shell test"))
        .returnsInstanceOf ("postgresql.Job")
        .commit ()

    .should ("return the value if it's not a models.Job")
        .given (10)
        .returns (10)
        .commit ()
;
