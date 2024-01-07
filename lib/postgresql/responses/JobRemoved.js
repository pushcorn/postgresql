module.exports = function (nit, postgresql)
{
    return postgresql.defineResponse ("JobRemoved")
        .info (200, "The job has been removed.")
        .field ("<job>", "postgresql.models.Job", "The removed job.")
    ;
};
