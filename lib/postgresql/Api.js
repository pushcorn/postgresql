module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Api", "http.Api")
        .use ("postgresql.Database")
        .categorize ("postgresql.apis")
        .serviceprovider ("postgresql:database")
        .defineComponentPlugin ()
    ;
};