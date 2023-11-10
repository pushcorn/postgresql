module.exports = function (nit, postgresql)
{
    return postgresql.defineTrigger ("TimestampUpdater")
        .field ("<fields...>", "string", "The fields to be updated.")
        .field ("actions...", "string", "The actions that should trigger the update.", "update")
            .constraint ("choice", "insert", "update")

        .onPreUpdate (function (ctx)
        {
            this.perform ("update", ctx);
        })
        .onPreInsert (function (ctx)
        {
            this.perform ("insert", ctx);
        })
        .method ("perform", function (action, ctx)
        {
            let ts = new Date;
            let modelClass = ctx.new.constructor;

            if (this.actions.includes (action))
            {
                for (let n of this.fields)
                {
                    let f = modelClass.getField (n);

                    modelClass.assign (ctx.new, { [f.name]: ts });
                }
            }
        })
    ;
};
