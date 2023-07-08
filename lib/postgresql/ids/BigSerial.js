module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineId ("BigSerial"))
        .registerTypeMapping (options => (options.reference ? "BIGINT" : "BIGSERIAL"))
        .staticMethod ("marshall", async function (model, ctx, field)
        {
            if (ctx?.action == "insert" && !model.value)
            {
                let cls = field.target.constructor;
                let query = postgresql.format ("SELECT NEXTVAL (PG_GET_SERIAL_SEQUENCE ('@table', &column))", { table: cls.tableName, column: field.column });

                this.assign (model, { value: await this.db.value (query) });
            }

            return await Self.superclass.marshall (model, ctx);
        })
    ;
};
