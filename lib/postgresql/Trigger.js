module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Trigger", "postgresql.Model.Trigger")
        .categorize ("postgresql.triggers")
    ;
};
