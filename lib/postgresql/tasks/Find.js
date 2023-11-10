module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Find")
        .describe ("Find a matching row from a table.")
        .field ("<table>", "string", "The table to be queried.")
        .field ("matches...", "any", "The row matching criteria.")
        .field ("otherClauses", "string", "The query clauses.")
        .onRun (async function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);

            return await db.find (self.table,
                nit.parseKvp (self.matches),
                self.otherClauses
            );
        })
    ;
};
