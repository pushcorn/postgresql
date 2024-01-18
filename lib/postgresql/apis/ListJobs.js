module.exports = function (nit, postgresql)
{
    return postgresql.defineApi ("ListJobs")
        .describe ("List queue jobs.", "postgresql:jobs-returned")
        .endpoint ("GET", "/postgresql/queue/jobs")
        .defineRequest (Request =>
        {
            Request
                .query ("[status]", "string", "The job status to filter.")
                    .constraint ("choice", "queued", "scheduled", "running", "failed", "succeeded", "dropped")
                .query ("offset", "integer", "The page offset.")
                .query ("limit", "integer", "The max page size.", 100)
                    .constraint ("min", 1)
                    .constraint ("max", 100)
            ;
        })
        .onDispatch (async function (ctx)
        {
            let { request: { status, limit, offset } } = ctx;
            let queueService = ctx.lookupService ("postgresql.QueueServer");
            let db = ctx.lookupService ("postgresql.Database");
            let Job = db.lookup (queueService.Job);
            let query = Job.Select ()
                .OrderBy ("rtime", "DESC")
                .Limit (limit)
                .Offset (offset)
            ;

            if (status)
            {
                query.Where ("status", status);
            }

            return await Job.select (query);
        })
    ;
};
