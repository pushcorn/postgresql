test.workflowStep ("postgresql:transaction")
    .useMockPgClient ()
    .should ("wrap other steps in a transaction")
        .defineModel ("test.models.User", User =>
        {
            User
                .field ("<id>", "integer", { key: true })
                .field ("[name]", "string")
            ;
        })
        .given (
        {
            steps:
            {
                type: "postgresql:save",
                model: "test.models.User",
                data: { name: "John Doe" }
            }
        })
        .up (s => s.WorkflowStep = s.postgresql.WorkflowStep)
        .registerDbService ()
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            BEGIN
            --
            SELECT *
            FROM "users"
            WHERE "id" = '0'
            LIMIT 1
            --
            INSERT INTO "users" ("id", "name")
            VALUES ('0', 'John Doe')
            --
            COMMIT
        `)
        .commit ()

    .should ("rollback the transaction if an error occurred")
        .given (
        {
            steps:
            {
                type: "postgresql:save",
                model: "test.models.User2",
                data: { name: "John Doe" }
            }
        })
        .up (s => s.WorkflowStep = s.postgresql.WorkflowStep)
        .registerDbService ()
        .throws ("error.component_not_found")
        .expectingMethodToReturnValue ("db.client.statements.join", "\n--\n", nit.trim.text`
            BEGIN
            --
            ROLLBACK
        `)
        .commit ()
;