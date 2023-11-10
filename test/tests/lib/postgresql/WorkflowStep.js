test.method ("postgresql.WorkflowStep", "getDb")
    .should ("return the current database")
        .given (nit.new ("nit.Workflow.Context"))
        .after (s => s.childContext = nit.new ("nit.Workflow.Subcontext", { parent: s.args[0] }))
        .expectingPropertyToBe ("args.0.workflow.listeners.nit\\.Workflow\\.complete.length", 1)
        .expecting ("the child context has the same db", s => s.object.getDb (s.childContext) == s.result)
        .commit ()
;
