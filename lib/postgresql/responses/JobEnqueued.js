module.exports = function (nit, postgresql)
{
    return postgresql.defineResponse ("JobEnqueued")
        .info (201, "The job has been enqueued.")
        .field ("<job>", "postgresql.Job", "The enqueued job.")
    ;
};
