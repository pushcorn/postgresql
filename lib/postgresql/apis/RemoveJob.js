module.exports = function (nit, postgresql)
{
    return postgresql.defineApi ("RemoveJob")
        .describe ("Remove a job from queue.", "postgresql:job-removed", "postgresql:job-not-found")
        .endpoint ("DELETE /postgresql/queue/jobs/:id")
        .apiplugin ("postgresql:transactional")
        .apiplugin ("postgresql:validate-entity-id", "postgresql.models.Job")
        .defineRequest (Request =>
        {
            Request
                .path ("<id>", "string", "The job ID.")
            ;
        })
        .onDispatch (async function (ctx)
        {
            let queueService = ctx.lookupService ("postgresql.QueueServer");
            let job = ctx.lookupObject ("postgresql.models.Job");
            let db = ctx.lookupService ("postgresql.Database");

            await job.delete ();
            await db.notify (queueService.channel);

            return job;
        })
    ;
};
