module.exports = function (nit, postgresql)
{
    return postgresql.defineId ("SmallSerial", "postgresql.ids.Serial")
        .registerTypeMapping (options => (options.reference ?  "SMALLINT" : "SMALLSERIAL"))
    ;
};
