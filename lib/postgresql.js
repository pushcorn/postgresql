module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql"))
        .staticMemo ("pg", () =>
        {
            let pg = require ("pg");

            pg.types.setTypeParser (1114, (text) => new Date (text + "Z"));

            return pg;
        })
        .staticMethod ("serialize", function (value)
        {
            if (nit.is.undef (value))
            {
                return "NULL";
            }
            else
            {
                return nit.serialize (value);
            }
        })

        .constant ("PARAM_PATTERN", /&([a-z0-9_]+)/ig)
        .constant ("NAME_PATTERN", /@([a-z0-9_]+)/ig)
        .constant ("TRANSFORMS",
        {
            id: function (v)
            {
                return Self.pg.Client.prototype.escapeIdentifier (nit.trim (v));
            }
            ,
            literal: function (v)
            {
                return nit.is.undef (v) ? "NULL" : Self.pg.Client.prototype.escapeLiteral (v instanceof Date ? v.toISOString () : (nit.is.obj (v) ? nit.toJson (v) : nit.trim (v)));
            }
            ,
            eq: function (v)
            {
                return nit.is.undef (v) ? "IS" : "=";
            }
        })
        .constant ("PARAM_REPLACERS",
        {
            id: function (m, property)
            {
                if (nit.is.int (property))
                {
                    property = "$" + property;
                }

                return "%{" + property + "|id}";
            }
            ,
            literal: function (m, property)
            {
                if (nit.is.int (property))
                {
                    property = "$" + property;
                }

                return "%{" + property + "|literal}";
            }
        })
        .constant ("TEMPLATE_CONFIG",
        {
            openTag: "%{",
            closeTag: "}",
            serialize: Self.serialize,
            transforms:
            {
                nit,
                ...Self.TRANSFORMS
            }
        })
        .staticMethod ("format", function (statement, ...params)
        {
            let data = nit.argsToObj (params, null, false);

            nit.each (data, function (v, k)
            {
                if (nit.is.int (k))
                {
                    delete data[k++];
                    data["$" + k] = v;
                }
            });

            statement = statement
                .replace (Self.PARAM_PATTERN, Self.PARAM_REPLACERS.literal)
                .replace (Self.NAME_PATTERN, Self.PARAM_REPLACERS.id)
            ;

            return nit.Template.render (statement, data, Self.TEMPLATE_CONFIG);
        })
    ;
};
