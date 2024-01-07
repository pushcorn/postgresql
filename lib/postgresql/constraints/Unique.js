module.exports = function (nit)
{
    return nit.defineConstraint ("postgresql.constraints.Unique")
        .m ("error.primary_key_fields_not_allowed", "The field '%{field}' cannot be part of the constraint because it is part of the primary key(s).")
        .m ("error.insufficient_values", "Some of the unique key values are missing: %{keys.join (', ')}.")
        .throws ("error.value_not_unique", "The value (%{#uniqueValue|nit.entries}%{k} = %{v|nit.NS.postgresql.formatValue}%{$LAST ? '' : ', '}%{/}) is not unique.")
        .property ("[fields...]")
        .onValidate (async function (ctx)
        {
            let { entity, constraint, field, value } = ctx;
            let Model = entity.constructor;
            let fields = constraint.fields.length ? constraint.fields : [field.name];
            let matches = nit.pick (entity, fields);
            let pkMatches = Model.getPrimaryKeyValues (entity);
            let pk;

            if (nit.keys (pkMatches).some (k => k in matches && (pk = k))) // the primary keys and the unique keys overlapped
            {
                this.throw ("error.primary_key_fields_not_allowed", { field: pk });
            }

            let pkValues = await Model.marshallData (pkMatches);
            let values = await Model.marshallData (matches);
            let matchKeys = nit.keys (matches);

            if (matchKeys.length != fields.length)
            {
                this.throw ("error.insufficient_values", { keys: fields.filter (f => !matchKeys.includes (f)) });
            }

            ctx.uniqueValue = fields.length > 1 ? values : { [fields[0]]: value };

            let query = new Model.Select;

            nit.each (values, (v, k) => query.Where (k, v));
            nit.each (pkValues, (v, k) => query.Where (k, v, "<>"));

            return !await Model.find (query);
        })
    ;
};
