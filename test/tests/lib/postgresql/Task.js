test.method ("postgresql.Task", "getDb")
    .should ("return a new db if none was bound to the given context")
        .given ({ id: "test" })
        .returnsInstanceOf ("postgresql.Database")
        .expecting ("the cached db will be returned for the same context", s => s.object.getDb (s.args[0]) == s.result)
        .expectingPropertyToBe ("object.listeners.nit\\.Task\\.postFinally.length", 1)
        .expecting ("the the db disconnect on postFinally", s => !!s.object.emit ("postFinally"))
        .commit ()
;
