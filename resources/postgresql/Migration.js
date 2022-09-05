module.exports = function (nit, postgresql)
{
    return postgresql.defineMigration ("{{name}}")
        .up (async function (db)
        {
        })
        .down (async function (db)
        {
        })
    ;
};
