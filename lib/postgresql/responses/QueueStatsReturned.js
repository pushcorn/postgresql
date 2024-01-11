module.exports = function (nit, postgresql)
{
    return postgresql.defineResponse ("QueueStatsReturned")
        .info (200, "The queue stats has been returned.")
        .field ("<stats>", "postgresql.QueueStats", "The queue stats.")
    ;
};
