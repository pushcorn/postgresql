module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql.QueueStats"))
        .defineInnerClass ("TaskQueueStats", TaskQueueStats =>
        {
            TaskQueueStats
                .field ("pending", "integer", "Number of pending tasks.")
                .field ("queued", "integer", "Number of queued tasks.")
            ;
        })
        .defineInnerClass ("PoolStats", PoolStats =>
        {
            PoolStats
                .field ("id", "string", "The database pool ID.")
                .field ("total", "integer", "Number of total clients.")
                .field ("waiting", "integer", "Number of waiting clients.")
                .field ("idle", "integer", "Number of idle clients.")
                .field ("size", "integer", "The pool size.")
            ;
        })
        .field ("running", "integer", "Number of running jobs.")
        .field ("queued", "integer", "Number of queued jobs.")
        .field ("scheduled", "integer", "Number of scheduled jobs.")
        .field ("succeeded", "integer", "Number of succeed jobs.")
        .field ("failed", "integer", "Number of failed jobs.")
        .field ("dropped", "integer", "Number of dropped jobs.")
        .field ("taskQueue", Self.TaskQueueStats.name, "The task queue stats.")
        .field ("pool", Self.PoolStats.name, "The database pool stats.")
    ;
};
