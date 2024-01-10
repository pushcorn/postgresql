test.object ("postgresql.WorkflowStep.Context", true, "db")
    .should ("return the current database")
        .returnsInstanceOf ("postgresql.Database")
        .commit ()
;
