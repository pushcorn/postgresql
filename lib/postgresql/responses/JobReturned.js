module.exports = function (nit, postgresql)
{
    return postgresql.defineResponse ("JobReturned")
        .info (200, "The job has been returned.")
        .field ("<job>", "postgresql.models.Job", "The job data.")
    ;
};
