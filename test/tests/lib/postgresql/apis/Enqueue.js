test.api ("postgresql.apis.Enqueue")
    .useMockDatabase ()
        .useModels ("postgresql.dbmodels.Job")
        .snapshot ()

    .should ("return ValidationFailed if the command was not given")
        .mock ("db", "save")
        .returnsInstanceOf ("postgresql.apis.Enqueue.Context")
        .expectingMethodToReturnValue ("result.response.toPojo", null,
        {
            violations:
            [
            {
                field: 'command',
                constraint: '',
                code: 'error.value_required',
                message: "The parameter 'command' is required."
            }
            ]
        })
        .commit ()

    .should ("enqueue a job")
        .given ({ data: { command: "shell echo test" } })
        .before (s => s.context.serviceproviders.push (s.db))
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
            s.db.rewrite ("COMMIT", "ROLLBACK");
        })
        .mock ("db", "save")
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2024-01-07T01:20:00.000Z");

            values.rtime = values.mtime = date;

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .returnsInstanceOf ("postgresql.apis.Enqueue.Context")
        .expectingMethodToReturnValueContaining ("result.response.toPojo", null,
        {
            "job":
            {
                "id": "aa69a37c-811a-4537-b3da-88b7af70be1c",
                "command": "shell echo test",
                "priority": 100,
                "status": "queued",
                "error": "",
                "output": "",
                "duration": 0,
                "exitCode": 0,
                "retries": 0
            }
        })
        .commit ()

    .should ("be able to enqueue a delayed job")
        .given ({ data: { command: "shell echo test2", scheduleDelay: 60 } })
        .before (s => s.context.serviceproviders.push (s.db))
        .before (s => s.now = Date.now ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
            s.db.rewrite ("COMMIT", "ROLLBACK");
        })
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod, strategy: s } = this;
            let date = new Date ("2024-01-07T01:20:00.000Z");

            s.rtime = values.rtime;
            values.rtime = values.mtime = date;

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("db", "save")
        .returnsInstanceOf ("postgresql.apis.Enqueue.Context")
        .expecting ("the job is scheduled after the specified delay", s => s.rtime - s.now >= 60000)
        .expectingMethodToReturnValueContaining ("result.response.toPojo", null,
        {
            "job":
            {
                "id": "aa69a37c-811a-4537-b3da-88b7af70be1c",
                "command": "shell echo test2",
                "priority": 100,
                "status": "scheduled",
                "error": "",
                "output": "",
                "duration": 0,
                "exitCode": 0,
                "retries": 0
            }
        })
        .commit ()

    .should ("be able to enqueue a job that runs at the specified time")
        .given ({ data: { command: "shell echo test2", scheduleAt: new Date ("2024-01-08T01:20:00.000Z") } })
        .before (s => s.context.serviceproviders.push (s.db))
        .before (s => s.now = Date.now ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
            s.db.rewrite ("COMMIT", "ROLLBACK");
        })
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2024-01-07T01:20:00.000Z");

            values.mtime = date;

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .returnsInstanceOf ("postgresql.apis.Enqueue.Context")
        .expectingPropertyToBe ("result.response.job.rtime", new Date ("2024-01-08T01:20:00.000Z"))
        .expectingMethodToReturnValueContaining ("result.response.toPojo", null,
        {
            "job":
            {
                "id": "aa69a37c-811a-4537-b3da-88b7af70be1c",
                "command": "shell echo test2",
                "priority": 100,
                "status": "scheduled",
                "error": "",
                "output": "",
                "duration": 0,
                "exitCode": 0,
                "retries": 0
            }
        })
        .commit ()
;
