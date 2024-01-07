module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Response", "http.Response")
        .categorize ("postgresql.responses")
    ;
};
