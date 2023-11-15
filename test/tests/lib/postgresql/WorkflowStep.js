test.object ("postgresql.WorkflowStep.Context", true, "db")
    .should ("return the current database")
        .returnsInstanceOf ("postgresql.Database")
        .expectingPropertyToBe ("instance.workflow.listeners.nit\\.Workflow\\.complete.length", 1)
        .expecting ("the child context has the same db", s => s.instance.db == s.result)
        .commit ()
;
