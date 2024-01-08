module.exports = function (nit, postgresql)
{
    return postgresql.defineApi ("Enqueue")
        .describe ("Enqueue a task.", "postgresql:job-enqueued")
        .endpoint ("POST", "/postgresql/queue/jobs")
        .defineRequest (Request =>
        {
            Request
                .form ("<command>", "command", "The command to run.")
                .form ("priority", "integer", "The job priority.", 100)
                .form ("channel", "string", "The queue channel.", "postgresql_jobs")
                .form ("jobModel", "string", "The job model name.", "postgresql.dbmodels.Job")
                .form ("scheduleAt", "date", "Schedule the job to run at the specified time.")
                .form ("scheduleDelay", "integer?", "Schedule the job to run after the specified delay in seconds.")
                    .constraint ("min", 1)
                .check ("exclusive", "scheduleAt", "scheduleDelay", { optional: true })
            ;
        })
        .onDispatch (async function (ctx)
        {
            let { command, priority, jobModel, channel, scheduleAt, scheduleDelay } = ctx.request;
            let db = ctx.db;
            let rtime;
            let status;

            if (scheduleDelay)
            {
                status = "scheduled";
                rtime = new Date (Date.now () + scheduleDelay * 1000);
            }
            else
            if (scheduleAt)
            {
                status = "scheduled";
                rtime = scheduleAt;
            }

            return await db.transact (async () =>
            {
                let Job = db.lookup (jobModel);
                let job = await Job.create ("", command, { priority, rtime, status });

                await db.notify (channel);

                return job;
            });
        })
    ;
};
