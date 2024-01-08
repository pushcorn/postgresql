module.exports = function (nit, postgresql)
{
    return postgresql.defineApi ("GetQueueStats")
        .endpoint ("GET", "/postgresql/queue/stats")
        .response ("postgresql:queue-stats-returned")
        .onDispatch (async function (ctx)
        {
            let queueService = ctx.lookupService ("postgresql.QueueServer");

            return { stats: await queueService.getStats () };
        })
    ;
};
