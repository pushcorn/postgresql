module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Insert")
        .describe ("Insert a row to the specified table.")
        .field ("<table>", "string", "The table to be inserted.")
        .field ("[values...]", "any", "The values to be inserted.")
        .onRun (async function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);

            return await db.insert (self.table,
                nit.parseKvp (self.values)
            );
        })
    ;
};
