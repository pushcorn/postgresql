test.object ("postgresql.Task.Context", true, "db")
    .should ("return a new db if none was bound to the given context")
        .before (s => s.instance.task = nit.new ("postgresql.Task"))
        .returnsInstanceOf ("postgresql.Database")
        .expecting ("the cached db will be returned for the same context", s => s.instance.db == s.result)
        .expectingPropertyToBe ("instance.task.listeners.nit\\.Task\\.postFinally.length", 1)
        .expecting ("the the db disconnect on postFinally", s => !!s.instance.task.emit ("postFinally"))
        .commit ()
;
