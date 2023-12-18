module.exports = function (nit, postgresql)
{
    return postgresql.defineModel ("Job")
        .field ("<id>", "postgresql.ids.Uuid", { key: true })
        .field ("<command>", "string", "The command to run.")
        .field ("[priority]", "integer", "The job priority.", 100)
        .field ("status", "string", "The job status.", "queued", { columnDefval: "'queued'" })
            .constraint ("choice", "queued", "scheduled", "running", "failed", "succeeded", "dropped")
        .field ("error", "string", "The error message.")
        .field ("output", "string", "The command output.")
        .field ("duration", "integer", "The total time to run the job.")
        .field ("exitCode", "integer", "The last command exit code.")
        .field ("retries", "integer", "The number of retries for the failed job.")
        .field ("mtime", "date", "The job modification time.", () => new Date, { columnDefval: "NOW ()" })
        .field ("rtime", "date", "The time at which the job should run.", () => new Date, { columnDefval: "NOW ()" })
        .trigger ("postgresql:TimestampUpdater", "mtime")
        .onPrepareTable (table => table.Index ("status", "priority", "rtime"))
    ;
};
