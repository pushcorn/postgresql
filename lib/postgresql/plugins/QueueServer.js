module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("postgresql.plugins.QueueServer"))
        .field ("<jobModel>", "string", "The job model name.")
            .constraint ("subclass", "postgresql.models.JobBase")
        .field ("[channel]", "string", "The channel to listen to.")
        .field ("concurrency", "integer", "The max number of running jobs.", 4)
        .use ("nit.Command")
        .use ("postgresql.Database")
        .use ("postgresql.queries.Update")
        .use ("postgresql.queries.Select")
        .use ("nit.utils.Timer")
        .onUsedBy (function (hostClass)
        {
            let plugin = this;

            hostClass
                .k ("createJobTable", "initArgs", "disconnectDatabase", "updateEnqueueTimer", "listenForNotifications")
                .plugin ("server")
                .plugin ("task-queue")
                .field ("channel", "string", "The channel to listen to.", plugin.channel)
                .field ("db", "postgresql.Database", "The database connection.")
                .defineInnerClass ("DatabaseProvider", "nit.ServiceProvider", DatabaseProvider =>
                {
                    DatabaseProvider
                        .field ("<server>", hostClass.name)
                        .onCreate (function ()
                        {
                            let db = this.server.db;

                            return db.pooling ? nit.assign (Self.Database (db.toPojo ()), { pool: db.pool }) : db;
                        })
                        .onDestroy (db => db.disconnect ())
                    ;
                })
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
                        .field ("taskQueue", Stats.TaskQueue.name)
                        .field ("pool", Stats.Pool.name)
                    ;
                })
                .do ("Task", Task =>
                {
                    Task
                        .k ("beginTransaction", "commitTransaction", "rollbackTransaction", "cancelTimer")
                        .defineMeta ("transactional", "boolean")
                        .property ("timer", "nit.utils.Timer")
                        .defineContext (Context =>
                        {
                            Context
                                .field ("cmdCtx", "nit.Context", "The command context.")
                                .field ("job", plugin.jobModel)
                                .field ("startTime", "integer", "The start time.", () => Date.now ())
                                .getter ("server", "task.owner")
                                .getter ("db", function () { return this.lookupService (Self.Database); })
                                .memo ("Job", function () { return this.db.lookup (this.server.Job.name); })
                                .memo ("duration", function () { return Date.now () - this.startTime; })
                                .onLookupServiceProvider (function (type)
                                {
                                    if (type == Self.Database)
                                    {
                                        return this.server.databaseProvider;
                                    }
                                })
                            ;
                        })
                        .configureComponentMethod ("run", Method =>
                        {
                            Method
                                .after (Task.kInitContext, Task.kBeginTransaction, async function (task, ctx)
                                {
                                    await ctx.db;

                                    if (task.constructor.transactional)
                                    {
                                        await ctx.db.begin ();
                                    }
                                })
                                .beforeSuccess (Task.kCommitTransaction, async function (task, ctx)
                                {
                                    if (task.constructor.transactional)
                                    {
                                        await ctx.db.commit ();
                                    }
                                })
                                .beforeFailure (Task.kRollbackTransaction, async function (task, ctx)
                                {
                                    if (task.constructor.transactional)
                                    {
                                        await ctx.db?.rollback ();
                                    }
                                })
                            ;
                        })
                        .configureComponentMethod ("cancel", Method =>
                        {
                            Method.after (Task.kInitCancelArgs, Task.kCancelTimer, task => task.timer?.cancel ());
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
                    return this.db.lookup (plugin.jobModel);
                })
                .memo ("notificationListener", function ()
                {
                    return nit.debounce (() => this.dequeue ());
                })
                .memo ("databaseProvider", function ()
                {
                    return new hostClass.DatabaseProvider (this);
                })
                .onConstruct (function ()
                {
                    let self = this;
                    let { db, channel } = self;

                    if (!db)
                    {
                        self.db = new Self.Database ({ pooling: hostClass.name });
                    }

                    if (!channel)
                    {
                        self.channel = self.Job.tableName;
                    }

                    self.taskQueue.concurrency = plugin.concurrency;
                })
                .configureComponentMethod ("start", Method =>
                {
                    Method
                        .after (hostClass.kStopIfStarted, hostClass.kCreateJobTable, async function ({ Job })
                        {
                            await Job.table.create (true);
                        })
                        .after (hostClass.kCreateJobTable, hostClass.kListenForNotifications, async function ({ db, channel, notificationListener })
                        {
                            await db.listen (channel);

                            db.client.on ("notification", notificationListener);
                        })
                        .after (hostClass.kUpdateEnqueueTimer, server => server.updateEnqueueTimer ())
                    ;
                })
                .configureComponentMethod ("stop", Method =>
                {
                    Method
                        .before (hostClass.kInitArgs, nit.typedFunc ({ server: hostClass, graceful: "boolean" }, function (server, graceful = false)
                        {
                            this.args = [graceful];
                        }))
                        .before (hostClass.kReturnServer, hostClass.kDisconnectDatabase, async function ({ taskQueue, db, channel, notificationListener }, graceful)
                        {
                            db.client?.off ("notification", notificationListener);

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
                        .lifecycleMethod ("buildQuery", true) // (query) => {}
                        .onRun (async function (ctx)
                        {
                            let self = this;
                            let { db, server, Job } = ctx;
                            let query = Self.Select ()
                                .From (Job.tableName)
                                .Where ("status", "queued")
                                .Append ("FOR UPDATE SKIP LOCKED")
                            ;

                            await self.buildQuery (query);

                            let job = await Job.find (query);

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
                        .lifecycleMethod ("saveResult", true) // (ctx) => {}
                        .onRun (async function (ctx)
                        {
                            let { db, Job } = ctx;
                            let job = ctx.job = await Job.load ({ id: this.id });
                            let argv = Self.Command.Input.tokenize (job.command);
                            let cls = nit.lookupCommand (argv.shift ());
                            let cmdCtx = ctx.cmdCtx = cls.Context.forInput (...argv)
                                .registerService (db)
                                .registerService (job)
                            ;

                            await db.disconnect ();
                            await cls ().run (cmdCtx);
                        })
                        .onRunComplete (async function (ctx)
                        {
                            let self = this;
                            let cmdCtx = nit.coalesce (ctx.cmdCtx, {});

                            cmdCtx.error = nit.coalesce (cmdCtx.error, ctx.error);

                            await self.saveResult (ctx);
                        })
                    ;
                })
                .defineQueuedTaskMethod ("updateEnqueueTimer", UpdateEnqueueTimer =>
                {
                    UpdateEnqueueTimer
                        .meta ("priority", 1)
                        .meta ("unique", true)
                        .lifecycleMethod ("getDelay", true) // (ctx) => time is ms
                        .onRun (async function (ctx)
                        {
                            let self = this;
                            let delay = await self.getDelay (ctx);

                            if (delay && await self.sleep (delay))
                            {
                                ctx.server.enqueueScheduledJobs ();
                            }
                        })
                    ;
                })
                .defineQueuedTaskMethod ("enqueueScheduledJobs", EnqueueScheduledJobs =>
                {
                    EnqueueScheduledJobs
                        .meta ("unique", true)
                        .lifecycleMethod ("buildQuery", true) // (query) => {}
                        .onRun (async function ({ db, Job, server })
                        {
                            let self = this;
                            let query = Self.Update ()
                                .Table (Job.tableName)
                                .Set ("status", "queued")
                            ;

                            await self.buildQuery (query);
                            await db.update (query);

                            server.dequeue ();
                        })
                    ;
                })
                .defineTaskMethod ("getStats", GetStats =>
                {
                    GetStats
                        .lifecycleMethod ("buildQuery", true) // (query) => {}
                        .onRun (async function ({ Job, db, server })
                        {
                            let self = this;
                            let query = Self.Select ()
                                .From (Job.tableName)
                                .ColumnExpr ("SUM (CASE WHEN status = 'running' THEN 1 ELSE 0 END)", "running")
                                .ColumnExpr ("SUM (CASE WHEN status = 'queued' THEN 1 ELSE 0 END)", "queued")
                                .ColumnExpr ("SUM (CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END)", "scheduled")
                            ;

                            await self.buildQuery (query);

                            let counts = await db.fetch (query);

                            return new hostClass.Stats (counts,
                            {
                                taskQueue: server.taskQueue.stats.toPojo (),
                                pool: db.pooling ? db.pool.stats.toPojo () : undefined
                            });
                        })
                    ;
                })
            ;
        })
    ;
};
