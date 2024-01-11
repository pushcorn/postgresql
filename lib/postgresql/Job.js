module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Job"))
        .use ("postgresql.models.Job")
        .field ("<id>", "string")
        .field ("<command>", "string", "The command to run.")
        .field ("[priority]", "integer", "The job priority.", 100)
        .field ("status", "string", "The job status.", "queued")
            .constraint ("choice", "queued", "scheduled", "running", "failed", "succeeded", "dropped")
        .field ("error", "string", "The error message.")
        .field ("output", "string", "The command output.")
        .field ("duration", "integer", "The total time to run the job.")
        .field ("exitCode", "integer", "The last command exit code.")
        .field ("retries", "integer", "The number of retries for the failed job.")
        .field ("mtime", "date", "The job modification time.")
        .field ("rtime", "date", "The time at which the job should run.")

        .defineCaster (job =>
        {
            if (job instanceof Self.Job)
            {
                job = new Self (job.toPojo (), { id: job.id.value });
            }

            return job;
        })
    ;
};
