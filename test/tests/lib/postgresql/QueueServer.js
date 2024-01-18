test.object ("postgresql.QueueServer")
    .should ("create a new pooled database if not provided")
        .given ({ channel: "my_channel" })
        .mock ("result", "dequeue", () => true)
        .mock (nit, "debounce", f => () => f ())
        .expectingPropertyToBe ("result.db.pooling", "postgresql.QueueServer")
        .expectingPropertyToBeOfType ("result.notificationListener", "function")
        .expectingMethodToReturnValue ("result.notificationListener", [], true)
        .commit ()
;


test.method ("postgresql.QueueServer", "start")
    .useMockDatabase ({ suffix: ".start" })
    .should ("start the queue server")
        .up (s => s.createArgs = { db: s.db })
        .after (s => s.object.stop ())
        .commit ()
;


test.method ("postgresql.QueueServer", "stop")
    .useMockDatabase ({ suffix: ".stop" })
    .should ("stop the queue server")
        .up (s => s.createArgs = { db: s.db })
        .before (s => s.object.start ())
        .commit ()
;


test.task ("postgresql.QueueServer.Task")
    .useMockPgClient ()
    .spy ("db.client", "query")
    .up (s => s.server = nit.new ("postgresql.QueueServer"))
    .up (s => s.server.db = s.db)
    .before (s => s.context.task = s.object)
    .before (s => s.object.owner = s.server)
    .snapshot ()

    .should ("not start the transaction by default")
        .commit ()

    .should ("start the transaction if transactional is true")
        .up (s => s.class = s.class.defineSubclass ("MyTask")
            .meta ("transactional", true)
        )
        .expectingPropertyToBe ("spies.0.invocations.0.args.0", "BEGIN")
        .expectingPropertyToBe ("spies.0.invocations.1.args.0", "COMMIT")
        .commit ()

    .should ("rollback the transaction on error")
        .up (s => s.class = s.class.defineSubclass ("MyTask")
            .meta ("transactional", true)
            .onRun (() => nit.throw ("MY_ERR"))
        )
        .throws ("MY_ERR")
        .expectingPropertyToBe ("spies.0.invocations.0.args.0", "BEGIN")
        .expectingPropertyToBe ("spies.0.invocations.1.args.0", "ROLLBACK")
        .commit ()

    .should ("skip rollback if transaction is not enabled")
        .up (s => s.class = s.class.defineSubclass ("MyTask")
            .onRun (() => nit.throw ("MY_ERR"))
        )
        .throws ("MY_ERR")
        .expectingPropertyToBe ("spies.0.invocations.length", 0)
        .commit ()
;


test.object ("postgresql.QueueServer.Task.Context")
    .useMockPgClient ()
    .snapshot ()
    .should ("acquire a connection from the pool if pooling is enabled")
        .before (s => s.instance.task = {})
        .before (s => s.instance.task.owner = nit.new ("postgresql.QueueServer",
        {
            db: { pooling: true }
        }))
        .after (s => s.instance.db)
        .expectingPropertyToBeOfType ("result.Job", "postgresql.models.Job", true)
        .expectingPropertyToBeOfType ("result.startTime", "integer")
        .expecting ("the duration is greater than zero", s => s.result.duration > 0)
        .commit ()

    .should ("use the existing db if pooling is not enabled")
        .before (s => s.instance.task = {})
        .before (s => s.instance.task.owner = nit.new ("postgresql.QueueServer",
        {
            db: { pooling: false, existing: true }
        }))
        .after (s => s.instance.db)
        .expectingPropertyToBe ("instance.db.pooling", false)
        .commit ()
;


test.method ("postgresql.QueueServer.Task.Context", "lookupServiceProvider")
    .should ("return undefined if the type is not postgresql.Database")
        .given ("postgresql.Model")
        .returns ()
        .commit ()
;


test.method ("postgresql.QueueServer.Task", "sleep")
    .should ("sleep for the given duration")
        .given (5)
        .returns (true)
        .commit ()

    .should ("return false if the timer was canceled")
        .given (10000)
        .before (s => setTimeout (() => s.object.timer.cancel (), 10))
        .returns (false)
        .commit ()
;


test.method ("postgresql.QueueServer", "dequeue")
    .should ("dequeue a job from the database")
        .useMockDatabase ({ suffix: ".dequeue" })
        .up (s => s.createArgs = { db: s.db })
        .mock ("object", "updateEnqueueTimer")
        .mock ("object", "runJob")
        .mock ("object", "dequeue", function ()
        {
            let { iteration, target, targetMethod } = this;

            if (iteration != 2)
            {
                return nit.invoke ([target, targetMethod], arguments);
            }
        })
        .mock ("class.Task.prototype", "sleep")
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("db", "disconnect")
        .before (s => s.object.start ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
            s.db.rewrite ("COMMIT", "-- COMMIT");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'"))
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.dequeue ())
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.stop ())
        .after (s => s.mocks[5].restore ())
        .after (s => s.db.disconnect ())
        .expectingPropertyToBe ("mocks.0.invocations.length", 2)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBe ("mocks.2.invocations.length", 3)
        .expectingPropertyToBe ("mocks.3.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.QueueServer", "runJob")
    .should ("save the output of a successful run")
        .useMockDatabase ({ suffix: ".runJob.succeeded" })
        .up (s => s.createArgs = { db: s.db })
        .mock (nit, "lookupCommand", function ()
        {
            return nit.defineCommand ("test.commands.MyCmd")
                .onRun (function ()
                {
                    return "my-cmd";
                })
            ;
        })
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("db", "update", function (table, values)
        {
            let { target, targetMethod } = this;

            values.duration = 200;

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("object", "dequeue")
        .mock ("db", "disconnect")
        .mock ("class.Task.prototype", "sleep")
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .before (s => s.object.start ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'"))
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.stop ())
        .after (s => s.mocks[4].restore ())
        .after (s => s.db.disconnect ())
        .expectingPropertyToContain ("mocks.2.invocations.1.args.1",
        {
            status: "succeeded",
            output: "my-cmd"
        })
        .expectingPropertyToBe ("mocks.3.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.QueueServer", "runJob")
    .should ("set job as dropped if max retries has been reached")
        .useMockDatabase ({ suffix: ".runJob.dropped" })
        .up (s => s.createArgs = { db: s.db, maxRetries: 1 })
        .mock (nit, "lookupCommand", function ()
        {
            return nit.defineCommand ("test.commands.MyCmd")
                .onRun (function ()
                {
                    nit.throw ("MY_CMD_ERR");
                })
            ;
        })
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;
            values.error = nit.trim (values.error).split ("\n").shift ();

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("db", "update", function (table, values)
        {
            let { target, targetMethod } = this;

            values.duration = 200;
            values.error = nit.trim (values.error).split ("\n").shift ();

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("object", "dequeue")
        .mock ("object.taskQueue", "error")
        .mock ("db", "disconnect")
        .mock ("class.Task.prototype", "sleep")
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .before (s => s.object.start ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'", { retries: 2 }))
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.stop ())
        .after (s => s.mocks[5].restore ())
        .after (s => s.db.disconnect ())
        .expectingPropertyToBe ("mocks.2.invocations.1.args.1.status", "dropped")
        .expectingPropertyToBe ("mocks.2.invocations.1.args.1.error", /MY_CMD_ERR/)
        .expectingPropertyToBe ("mocks.3.invocations.length", 1)
        .expectingPropertyToBe ("mocks.4.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.QueueServer", "runJob")
    .should ("set job as failed on error")
        .useMockDatabase ({ suffix: ".runJob.failed" })
        .up (s => s.createArgs = { db: s.db })
        .mock (nit, "lookupCommand", function ()
        {
            return nit.defineCommand ("test.commands.MyCmd")
                .onRun (function ()
                {
                    nit.throw ("MY_CMD_ERR");
                })
            ;
        })
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;
            values.error = nit.trim (values.error).split ("\n").shift ();

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("db", "update", function (table, values)
        {
            let { target, targetMethod } = this;

            values.duration = 200;
            values.error = nit.trim (values.error).split ("\n").shift ();

            if (values.rtime)
            {
                values.rtime = new Date ("2023-12-18T02:15:21.609Z");
            }

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("object", "updateEnqueueTimer")
        .mock ("object.taskQueue", "error")
        .mock ("db", "disconnect")
        .mock ("class.Task.prototype", "sleep")
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .before (s => s.object.start ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'"))
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.stop ())
        .after (s => s.mocks[5].restore ())
        .after (s => s.db.disconnect ())
        .expectingPropertyToBe ("mocks.2.invocations.1.args.1.error", /MY_CMD_ERR/)
        .expectingPropertyToBe ("mocks.2.invocations.1.args.1.status", "failed")
        .expectingPropertyToBe ("mocks.2.invocations.1.args.1.retries", 1)
        .expectingPropertyToBe ("mocks.3.invocations.length", 2)
        .expectingPropertyToBe ("mocks.4.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.QueueServer", "updateEnqueueTimer")
    .should ("set up the timer for the failed or scheduled job")
        .useMockDatabase ({ suffix: ".updateEnqueueTimer" })
        .up (s => s.createArgs = { db: s.db })
        .up (s => s.class.UpdateEnqueueTimerTask.updated = false)
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;
            values.status = "scheduled";

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("object", "enqueueScheduledJobs")
        .mock ("class.Task.prototype", "sleep", async function ()
        {
            let { iteration, strategy: s } = this;

            if (iteration == 5)
            {
                let job = await s.object.Job.get ("aa69a37c-811a-4537-b3da-88b7af70be1c");

                await job.update ({ status: "failed" });
            }

            if (iteration == 1 || iteration == 3 || iteration == 4 || iteration == 5)
            {
                return true;
            }
        })
        .mock ("db", "disconnect")
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .before (s => s.object.start ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'"))
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.updateEnqueueTimer ())
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.updateEnqueueTimer ())
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.updateEnqueueTimer ())
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.stop ())
        .after (s => s.mocks[3].restore ())
        .after (s => s.db.disconnect ())
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBe ("mocks.2.invocations.1.args.0", 100)
        .commit ()
;


test.method ("postgresql.QueueServer", "enqueueScheduledJobs")
    .should ("update failed or scheduled jobs to queued")
        .useMockDatabase ({ suffix: ".enqueueScheduledJobs" })
        .up (s => s.createArgs = { db: s.db })
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;
            values.status = "scheduled";

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("object", "dequeue")
        .mock ("class.Task.prototype", "sleep")
        .mock ("db", "disconnect")
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .before (s => s.object.start ())
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'"))
        .after (s => s.object.taskQueue.waitUntilIdle ())
        .after (s => s.object.stop ())
        .after (s => s.mocks[3].restore ())
        .after (s => s.db.disconnect ())
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()
;


test.method ("postgresql.QueueServer", "getStats")
    .should ("return the server stats")
        .useMockDatabase ({ suffix: ".getStats" })
        .up (s => s.createArgs = { db: s.db })
        .useModels ("postgresql.models.Job")
        .mock ("db", "insert", function (table, values)
        {
            let { target, targetMethod } = this;
            let date = new Date ("2023-12-18T01:15:21.609Z");

            values.rtime = values.mtime = date;
            values.status = "scheduled";

            return nit.invoke ([target, targetMethod], [table, values]);
        })
        .mock ("db", "disconnect")
        .mock ("object", "updateEnqueueTimer")
        .mock ("db.client", "query", async function ()
        {
            let { target, targetMethod } = this;
            let result = await nit.invoke ([target, targetMethod], arguments);

            if (nit.get (result, "rows.0.tablename") == "postgresql_jobs")
            {
                result.rows[0].tableowner = "";
            }

            return result;
        })
        .given ("aa69a37c-811a-4537-b3da-88b7af70be1c")
        .before (s =>
        {
            s.db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT 'aa69a37c-811a-4537-b3da-88b7af70be1c' AS uuid_generate_v4");
        })
        .before (s => s.object.Job.create ("", "shell echo 'test'"))
        .before (s => s.object.start ())
        .after (s => s.object.databaseProvider.create = () => s.db)
        .after (s => s.db.pooling = "test")
        .after (s => s.db.pool = {})
        .after (s => nit.dpg (s.db.pool, "stats", () => nit.new ("postgresql.Pool.Stats", { id: "test" })))
        .after (async (s) => s.statsWithPool = await s.object.getStats ())
        .after (s => s.object.stop (true))
        .after (s => s.mocks[1].restore ())
        .after (s => s.db.disconnect ())
        .returnsInstanceOf ("postgresql.QueueServer.Stats")
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            running: 0,
            queued: 0,
            scheduled: 1,
            succeeded: 0,
            failed: 0,
            dropped: 0,
            taskQueue:
            {
                pending: 0,
                queued: 0
            }
            ,
            pool: undefined
        })
        .expectingPropertyToBe ("statsWithPool",
        {
            running: 0,
            queued: 0,
            scheduled: 1,
            succeeded: 0,
            failed: 0,
            dropped: 0,
            taskQueue:
            {
                pending: 0,
                queued: 0
            }
            ,
            pool:
            {
                id: "test",
                idle: 0,
                size: 0,
                total: 0,
                waiting: 0
            }
        })
        .commit ()
;
