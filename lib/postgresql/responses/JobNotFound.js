module.exports = function (nit, postgresql)
{
    return postgresql.defineResponse ("JobNotFound")
        .info (404, "The job was not found.", "error.job_not_found")
    ;
};
