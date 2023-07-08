module.exports = function (nit)
{
    return nit.defineClass ("postgresql.TypeOptions")
        .field ("reference", "boolean", "Type for a reference column.")
    ;
};
