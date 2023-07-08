module.exports = function (nit, postgresql)
{
    return postgresql.defineMigration ("{{name}}")
        .onUp (async function (db)
        {
        })
        .onDown (async function (db)
        {
        })
    ;
};
