test.object ("postgresql.Task.Context", true, "db")
    .should ("return a new db if none was bound to the given context")
        .before (s => s.instance.task = nit.new ("postgresql.Task"))
        .returnsInstanceOf ("postgresql.Database")
        .expecting ("the cached db will be returned for the same context", s => s.instance.db == s.result)
        .expectingMethodToReturnValue ("instance.lookupService", ["nit.Task", true], undefined)
        .commit ()
;
