module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Value")
        .describe ("Get the first column value of the selected row.")
        .field ("<statement>", "string", "The query to run.")
        .field ("[parameters...]", "string", "The query parameters.")
        .onRun (async function (ctx)
        {
            let self = this;

            return await ctx.db.value (self.statement, ...self.parameters);
        })
    ;
};