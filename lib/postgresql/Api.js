module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql.Api", "http.Api"))
        .use ("postgresql.Database")
        .categorize ("postgresql.apis")
        .serviceprovider ("postgresql:database")
        .defineComponentPlugin ()
    ;
};
