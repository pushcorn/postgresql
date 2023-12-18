test.method ("postgresql.models.Job", "nit.Object.caster", true)
    .should ("support casting of dbmodel.Job")
        .given (nit.lookupClass ("postgresql.dbmodels.Job").new (nit.uuid (), "shell test"))
        .returnsInstanceOf ("postgresql.models.Job")
        .commit ()

    .should ("return the value if it's not a dbmodel.Job")
        .given (10)
        .returns (10)
        .commit ()
;
