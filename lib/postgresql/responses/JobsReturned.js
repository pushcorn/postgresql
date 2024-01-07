module.exports = function (nit, postgresql)
{
    return postgresql.defineResponse ("JobsReturned")
        .info (200, "The jobs has been returned.")
        .field ("[jobs...]", "postgresql.models.Job")
    ;
};
