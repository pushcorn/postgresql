module.exports = function (nit, postgresql)
{
    return postgresql.defineModel ("Job", "postgresql.models.JobBase")
        .field ("[priority]", "integer", "The job priority.", 100, { order: 10 })
        .field ("status", "string", "The job status.", "queued", { columnDefval: "'queued'", order: 50 })
            .constraint ("choice", "queued", "scheduled", "running", "failed", "succeeded", "dropped")
        .field ("retries", "integer", "The number of retries for the failed job.")
        .field ("rtime", "date", "The time at which the job should run.", () => new Date, { columnDefval: "NOW ()", order: 200 })
        .onPrepareTable (table => table.Index ("status", "priority", "rtime"))
    ;
};
