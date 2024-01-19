module.exports = function (nit, postgresql)
{
    return postgresql.defineModel ("JobBase")
        .field ("<id>", "postgresql.ids.Uuid", { key: true, order: 0 })
        .field ("<command>", "string", "The command to run.", { order: 10 })
        .field ("status", "string", "The job status.", "queued", { columnDefval: "'queued'", order: 50 })
            .constraint ("choice", "queued", "scheduled", "running")
        .field ("error", "string", "The error message.")
        .field ("output", "string", "The command output.")
        .field ("duration", "integer", "The total time to run the job.")
        .field ("exitCode", "integer", "The last command exit code.")
        .field ("mtime", "date", "The job modification time.", () => new Date, { columnDefval: "NOW ()", order: 200 })
        .trigger ("postgresql:TimestampUpdater", "mtime")
    ;
};
