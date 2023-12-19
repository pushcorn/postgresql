module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.QueueServer"))
        .m ("error.job_not_found", "The job was not found.")
        .use ("nit.Command")
        .use ("postgresql.dbmodels.Job")
        .use ("postgresql.Database")
        .use ("postgresql.queries.Select")
        .use ("postgresql.queries.Update")
        .use ("nit.utils.Timer")
        .plugin ("server")
        .plugin ("task-queue")
        .field ("<jobModel>", "string", "The job model name.", "postgresql.dbmodels.Job")
            .constraint ("subclass", "postgresql.dbmodels.Job", true)
        .field ("channel", "string", "The channel to listen to.")
        .field ("db", "postgresql.Database", "The database connection.")
        .field ("concurrency", "integer", "The max number of running jobs.", 4)
        .field ("maxRetries", "integer", "The max number of retries for a failed job.", 5)
        .field ("retryDelay", "integer", "The base delay time in ms for job retry. The total delay time will be retries * retryDelay.", 60 * 1000)

        .defineInnerClass ("Stats", Stats =>
        {
            Stats
                .defineInnerClass ("TaskQueue", TaskQueue =>
                {
                    TaskQueue
                        .field ("pending", "integer")
                        .field ("queued", "integer")
                    ;
                })
                .defineInnerClass ("Pool", Pool =>
                {
                    Pool
                        .field ("id", "string")
                        .field ("total", "integer")
                        .field ("waiting", "integer")
                        .field ("idle", "integer")
                        .field ("size", "integer")
                    ;
                })
                .field ("running", "integer")
                .field ("queued", "integer")
                .field ("scheduled", "integer")
                .field ("succeeded", "integer")
                .field ("failed", "integer")
                .field ("dropped", "integer")
                .field ("taskQueue", Stats.TaskQueue.name)
                .field ("pool", Stats.Pool.name)
            ;
        })
        .do ("Task", Task =>
        {
            Task
                .defineMeta ("transactional", "boolean")
                .property ("timer", "nit.utils.Timer")
                .defineContext (Context =>
                {
                    Context
                        .field ("ctx", "nit.Context", "The command context.")
                        .field ("job", "postgresql.dbmodels.Job")
                        .field ("startTime", "integer", "The start time.", () => Date.now ())
                        .getter ("server", "task.owner")
                        .memo ("db", async function ()
                        {
                            let db = this.server.db;

                            return db.pooling ? (await db.acquire ()) : db;
                        })
                        .memo ("Job", function () { return this.db.lookup (this.server.Job.name); })
                        .memo ("duration", function () { return Date.now () - this.startTime; })
                    ;
                })
                .configureComponentMethod ("run", Queue =>
                {
                    Queue
                        .after ("preAll", "preAll.beginTransaction", async function (task, ctx)
                        {
                            await ctx.db;

                            if (task.constructor.transactional)
                            {
                                await ctx.db.begin ();
                            }
                        })
                        .before ("postAll", "postAll.endTransaction", async function (task, ctx)
                        {
                            if (task.constructor.transactional)
                            {
                                await ctx.db.commit ();
                            }
                        })
                    ;
                })
                .configureComponentMethod ("catch", Queue =>
                {
                    Queue
                        .after ("preAll", "preAll.rollbackTransaction", async function (task, ctx)
                        {
                            if (task.constructor.transactional)
                            {
                                await ctx.db?.rollback ();
                            }
                        })
                    ;
                })
                .configureComponentMethod ("finally", Queue =>
                {
                    Queue.after ("postAll", "postAll.disconnect", true, (task, ctx) => ctx.db?.disconnect ());
                })
                .configureComponentMethod ("cancel", Queue =>
                {
                    Queue.after ("preAll", "preAll.cancelTimer", true, task => task.timer?.cancel ());
                })
                .method ("sleep", async function (duration)
                {
                    let self = this;

                    await (self.timer = Self.Timer (duration)).start ();

                    return self.timer.status != "canceled";
                })
            ;
        })
        .memo ("Job", function ()
        {
            return this.db.lookup (this.jobModel);
        })
        .memo ("notificationListener", function ()
        {
            return nit.debounce (() => this.dequeue ());
        })
        .onConstruct (function ()
        {
            let self = this;
            let { db, channel } = self;

            if (!db)
            {
                self.db = new Self.Database ({ pooling: Self.name });
            }

            if (!channel)
            {
                self.channel = self.Job.tableName;
            }

            self.taskQueue.concurrency = self.concurrency;
        })
        .configureComponentMethod ("start", Queue =>
        {
            Queue
                .before ("start.invokeHook", "start.createJobTable", async function ({ Job, db, channel, notificationListener })
                {
                    await Job.table.create (true);
                    await db.update (Job.tableName, { status: "queued" }, { status: "running" });
                    await db.listen (channel);

                    db.client.on ("notification", notificationListener);
                })
                .after ("postAll", server => server.updateEnqueueTimer ())
            ;
        })
        .configureComponentMethod ("stop", Queue =>
        {
            Queue
                .onInit (nit.typedFunc ({ server: Self, graceful: "boolean" }, function (server, graceful)
                {
                    this.args = [graceful];
                }))
                .after ("stop.invokeHook", "stop.disconnect", async function ({ taskQueue, db, channel, notificationListener }, graceful)
                {
                    db.client.off ("notification", notificationListener);

                    await taskQueue.stop (graceful);
                    await nit.invoke.silent ([db, "unlisten"], channel);
                    await db.disconnect ();
                })
            ;
        })
        .defineQueuedTaskMethod ("dequeue", Dequeue =>
        {
            Dequeue
                .meta ("transactional", true)
                .meta ("unique", true)
                .onRun (async function ({ db, server, Job })
                {
                    let self = this;
                    let job = await Job.find ({ status: "queued" }, Self.Select ()
                        .OrderBy ("priority")
                        .OrderBy ("rtime")
                        .Append ("FOR UPDATE SKIP LOCKED")
                    );

                    if (job)
                    {
                        await job.update ({ status: "running" });
                        await db.commit ();

                        server.runJob (job.id.value);
                        server.dequeue ();
                    }
                    else
                    {
                        server.updateEnqueueTimer ();

                        await db.rollback ();
                        await self.sleep (500);
                    }
                })
            ;
        })
        .defineQueuedTaskMethod ("runJob", RunJob =>
        {
            RunJob
                .field ("<id>", "string")
                .onRun (async function (c)
                {
                    let { db, Job } = c;
                    let job = c.job = await Job.load ({ id: this.id });
                    let argv = Self.Command.Input.tokenize (job.command);
                    let cls = nit.lookupCommand (argv.shift ());
                    let ctx = c.ctx = cls.Context.forInput (...argv)
                        .registerService (db)
                        .registerService (job)
                    ;

                    await db.disconnect ();
                    await cls ().run (ctx);
                })
                .onFinally (async function (c)
                {
                    let { ctx, job, server, duration } = c;

                    ctx = nit.coalesce (ctx, {});
                    ctx.error = nit.coalesce (ctx.error, c.error);

                    if (!ctx.error)
                    {
                        await job.update ({ status: "succeeded", duration, output: nit.serialize (ctx.output), error: null, exitCode: ctx.exitCode });

                        server.dequeue ();
                    }
                    else
                    {
                        let retries = job.retries + 1;

                        if (retries > server.maxRetries)
                        {
                            await job.update ({ status: "dropped", duration, error: ctx.error.stack });

                            server.dequeue ();
                        }
                        else
                        {
                            await job.update ({ status: "failed", duration, retries, error: ctx.error.stack, rtime: Date.now () + retries * server.retryDelay, exitCode: ctx.exitCode });

                            server.updateEnqueueTimer ();
                        }
                    }
                })
            ;
        })
        .defineQueuedTaskMethod ("updateEnqueueTimer", UpdateEnqueueTimer =>
        {
            UpdateEnqueueTimer
                .meta ("priority", 1)
                .meta ("unique", true)
                .staticProperty ("updated", "boolean")
                .onRun (async function ({ server, Job })
                {
                    let self = this;

                    if (UpdateEnqueueTimer.updated && !(await self.sleep (5000)))
                    {
                        return;
                    }

                    UpdateEnqueueTimer.updated = true;

                    let job = await Job.find (Self.Select ()
                            .WhereExpr ("status IN ('failed', 'scheduled')")
                            .OrderBy ("priority")
                            .OrderBy ("rtime")
                        );

                    if (job)
                    {
                        let delay = Math.max (100, job.rtime - Date.now ());

                        if (await self.sleep (delay))
                        {
                            server.enqueueScheduledTasks ();
                        }
                    }
                })
            ;
        })
        .defineQueuedTaskMethod ("enqueueScheduledTasks", EnqueueScheduledTasks =>
        {
            EnqueueScheduledTasks
                .meta ("unique", true)
                .onRun (async function ({ db, Job, server })
                {
                    await db.update (Job.tableName, { status: "queued" },
                        Self.Update ()
                            .WhereExpr ("status IN ('failed', 'scheduled')")
                            .WhereExpr ("rtime < TIMEZONE ('UTC', NOW ())")
                    );

                    server.dequeue ();
                })
            ;
        })
        .defineTaskMethod ("getStats", GetStats =>
        {
            GetStats
                .onRun (async ({ Job, db, server }) =>
                {
                    let counts = await db.fetch (Self.Select ()
                            .From (Job.tableName)
                            .ColumnExpr ("SUM (CASE WHEN status = 'running' THEN 1 ELSE 0 END)", "running")
                            .ColumnExpr ("SUM (CASE WHEN status = 'queued' THEN 1 ELSE 0 END)", "queued")
                            .ColumnExpr ("SUM (CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END)", "scheduled")
                            .ColumnExpr ("SUM (CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END)", "succeeded")
                            .ColumnExpr ("SUM (CASE WHEN status = 'failed' THEN 1 ELSE 0 END)", "failed")
                            .ColumnExpr ("SUM (CASE WHEN status = 'dropped' THEN 1 ELSE 0 END)", "dropped")
                    );

                    return new Self.Stats (counts,
                    {
                        taskQueue: server.taskQueue.stats.toPojo (),
                        pool: db.pooling ? db.pool.stats.toPojo () : undefined
                    });
                })
            ;
        })
    ;
};
