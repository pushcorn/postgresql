module.exports = function (nit, postgresql)
{
    return nit.defineConstraint ("postgresql.constraints.Unique")
        .throws ("error.value_not_unique", "The value '%{value|nit.Object.serialize}' is not unique.")
        .property ("[fields...]")
        .validate (async function (value, ctx)
        {
            const Model = ctx.model.constructor;

            let uniqueFields = ctx.constraint.fields.length ? ctx.constraint.fields : [ctx.field.name];
            let modelFields = nit.index (Model.getProperties (), "name");
            let matches = {};
            let values = {};
            let keyMatches = {};

            Model.getKeyFields ().forEach (f =>
            {
                keyMatches[f.column] = ctx.model[f.name];
            });

            uniqueFields.forEach (f =>
            {
                f = modelFields[f];
                matches[f.column] = values[f.name] = ctx.model[f.name];
            });

            if (uniqueFields.length > 1)
            {
                ctx.value = values;
            }

            return !await ctx.db.find (
                Model.table.name,
                matches,
                postgresql.format ("%{#keyMatches|nit.entries}\nAND %{k|id} %{v|ne} %{v|literal}%{/}", { keyMatches })
            );
        })
    ;
};
