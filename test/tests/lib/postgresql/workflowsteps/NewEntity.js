test.workflowStep ("postgresql:new-entity")
    .useMockPgClient ()
    .should ("create an entity without saving it")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given ("test.models.User", { data: { id: 10, name: "John Doe" } })
        .mockGetDb ()
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBeOfType ("result.output", "test.models.User")
        .expectingPropertyToBe ("result.output.id", 10)
        .commit ()
;
