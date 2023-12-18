module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Enqueue")
        .describe ("Enqueue a job.", "postgresql.responses.JobEnqueued")
        .defineInput (Input =>
        {
            Input
                .option ("<command>", "command", "The command to run.")
                .option ("priority", "integer", "The job priority.", 100)
                .option ("channel", "string", "The queue channel.", "postgresql_jobs")
                .option ("jobModel", "string", "The job model name.", "postgresql.dbmodels.Job")
                .option ("scheduleAt", "date", "Schedule the job to run at the specified time.")
                .option ("scheduleDelay", "integer?", "Schedule the job to run after the specified delay in seconds.")
                    .constraint ("min", 1)
                .check ("exclusive", "scheduleAt", "scheduleDelay", { optional: true })
            ;
        })
        .onRun (async function ({ input, db })
        {
            let { command, priority, jobModel, channel, scheduleAt, scheduleDelay } = input;
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
