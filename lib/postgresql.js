module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql"))
        .constant ("HOME", nit.new ("nit.Dir", nit.path.dirname (__dirname)))
        .staticMemo ("pg", () =>
        {
            let pg = require ("pg");

            pg.types.setTypeParser (1114, (text) => new Date (text + "Z"));

            return pg;
        })
        .staticMemo ("escapeIdentifier", function ()
        {
            return Self.pg.Client.prototype.escapeIdentifier;
        })
        .staticMemo ("escapeLiteral", function ()
        {
            return Self.pg.Client.prototype.escapeLiteral;
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
                if (v.includes ("."))
                {
                    let vs = v.split (".");

                    return "JSONB_EXTRACT_PATH_TEXT ("
                        + [Self.escapeIdentifier (vs.shift ()), ...vs.map (Self.escapeLiteral)].join (", ")
                        + ")";
                }
                else
                {
                    let n = v.split (/->>?/).shift ();
                    let p = v == n ? "" : v.slice (n.length);

                    n = Self.escapeIdentifier (nit.trim (n));

                    return n + p;
                }
            }
            ,
            literal: function (v)
            {
                return nit.is.undef (v) ? "NULL" : Self.escapeLiteral (v instanceof Date ? v.toISOString () : (nit.is.obj (v) ? nit.toJson (v) : nit.trim (v)));
            }
            ,
            eq: function (v)
            {
                return nit.is.undef (v) ? "IS" : "=";
            }
            ,
            ne: function (v)
            {
                return nit.is.undef (v) ? "IS NOT" : "<>";
            }
        })
        .constant ("PATTERN_REPLACERS",
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
                .replace (Self.PARAM_PATTERN, Self.PATTERN_REPLACERS.literal)
                .replace (Self.NAME_PATTERN, Self.PATTERN_REPLACERS.id)
            ;

            return nit.Template.render (statement, data, Self.TEMPLATE_CONFIG).trim ();
        })
        .require ("postgresql.Command")
        .require ("postgresql.Model")
        .require ("postgresql.Transform")
    ;
};
