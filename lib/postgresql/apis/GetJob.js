module.exports = function (nit, postgresql)
{
    return postgresql.defineApi ("GetJob")
        .describe ("Show the details of a job.", "postgresql:job-returned", "postgresql:job-not-found")
        .endpoint ("GET /postgresql/queue/jobs/:id")
        .apiplugin ("postgresql:validate-entity-id", "postgresql.dbmodels.Job")
        .defineRequest (Request =>
        {
            Request
                .path ("<id>", "string", "The job ID.")
            ;
        })
        .onDispatch (async function (ctx)
        {
            return ctx.lookupObject ("postgresql.dbmodels.Job");
        })
    ;
};
