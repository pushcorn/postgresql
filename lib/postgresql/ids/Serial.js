module.exports = function (nit, postgresql)
{
    return postgresql.defineId ("Serial", "postgresql.ids.BigSerial")
        .registerTypeMapping (options => (options.reference ? "INTEGER" : "SERIAL"))
        .field ("[value]", "intstr")
    ;
};
