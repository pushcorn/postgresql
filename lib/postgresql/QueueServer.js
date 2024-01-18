module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.QueueServer"))
        .k ("initJobTable")
        .use ("postgresql.queries.Select")
        .plugin ("postgresql:queue-server", "postgresql.models.Job")
        .field ("maxRetries", "integer", "The max number of retries for a failed job.", 5)
        .field ("retryDelay", "integer", "The base delay time in ms for job retry. The total delay time will be retries * retryDelay.", 60 * 1000)

        .do ("Stats", Stats =>
        {
            Stats
                .field ("succeeded", "integer")
                .field ("failed", "integer")
                .field ("dropped", "integer")
            ;
        })
        .configureComponentMethod ("start", Method =>
        {
            Method
                .after (Self.kCreateJobTable, Self.kInitJobTable, async function ({ Job, db })
                {
                    await db.update (Job.tableName, { status: "queued" }, { status: "running" });
                })
            ;
        })
        .do ("DequeueTask", DequeueTask =>
        {
            DequeueTask
                .onBuildQuery (query => query
                    .OrderBy ("priority")
                    .OrderBy ("rtime")
                )
            ;
        })
        .do ("RunJobTask", RunJobTask =>
        {
            RunJobTask
                .onSaveResult (async function ({ cmdCtx, job, server, duration })
                {
                    if (!cmdCtx.error)
                    {
                        await job.update ({ status: "succeeded", duration, output: nit.serialize (cmdCtx.output), error: null, exitCode: cmdCtx.exitCode });

                        server.dequeue ();
                    }
                    else
                    {
                        let retries = job.retries + 1;

                        if (retries > server.maxRetries)
                        {
                            await job.update ({ status: "dropped", duration, error: cmdCtx.error.stack });

                            server.dequeue ();
                        }
                        else
                        {
                            await job.update ({ status: "failed", duration, retries, error: cmdCtx.error.stack, rtime: Date.now () + retries * server.retryDelay, exitCode: cmdCtx.exitCode });

                            server.updateEnqueueTimer ();
                        }
                    }
                })
            ;
        })
        .do ("UpdateEnqueueTimerTask", UpdateEnqueueTimerTask =>
        {
            UpdateEnqueueTimerTask
                .staticProperty ("updated", "boolean")
                .onGetDelay (async function ({ Job })
                {
                    let self = this;

                    if (UpdateEnqueueTimerTask.updated && !(await self.sleep (5000)))
                    {
                        return;
                    }

                    UpdateEnqueueTimerTask.updated = true;

                    let job = await Job.find (Self.Select ()
                        .WhereExpr ("status IN ('failed', 'scheduled')")
                        .OrderBy ("priority")
                        .OrderBy ("rtime")
                    );

                    if (job)
                    {
                        return Math.max (100, job.rtime - Date.now ());
                    }
                })
            ;
        })
        .do ("EnqueueScheduledJobsTask", EnqueueScheduledJobsTask =>
        {
            EnqueueScheduledJobsTask
                .onBuildQuery (query => query
                    .WhereExpr ("status IN ('failed', 'scheduled')")
                    .WhereExpr ("rtime < TIMEZONE ('UTC', NOW ())")
                )
            ;
        })
        .do ("GetStatsTask", GetStatsTask =>
        {
            GetStatsTask
                .onBuildQuery (query => query
                    .ColumnExpr ("SUM (CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END)", "succeeded")
                    .ColumnExpr ("SUM (CASE WHEN status = 'failed' THEN 1 ELSE 0 END)", "failed")
                    .ColumnExpr ("SUM (CASE WHEN status = 'dropped' THEN 1 ELSE 0 END)", "dropped")
                )
            ;
        })
    ;
};
