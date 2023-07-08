module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql"))
        .constant ("HOME", nit.new ("nit.Dir", nit.path.dirname (__dirname)))
        .do (() =>
        {
            Self.registerTypeParser (new Self.PrimitiveTypeParser ("intstr", "", function (v) { return nit.is.int (v) ? +v : ""; }));
        })
        .staticMemo ("pg", () =>
        {
            const pg = require ("pg");

            pg.types.setTypeParser (1114, (text) => new Date (text + (text.slice (-1) == "Z" ? "" : "Z")));
            pg.utils = require ("pg/lib/utils");

            return pg;
        })
        .staticMemo ("escapeIdentifier", function ()
        {
            return Self.pg.utils.escapeIdentifier;
        })
        .staticMethod ("escapeLiteral", function (v)
        {
            return nit.is.undef (v) ? "NULL" : nit.trim (Self.pg.utils.escapeLiteral (v));
        })
        .staticMethod ("normalizeValue", function normalizeValue (v)
        {
            if (nit.is.undef (v))
            {
                return null;
            }
            else
            if (v instanceof Date)
            {
                return v.toISOString ();
            }
            else
            if (nit.is.obj (v))
            {
                return nit.each.obj (v, normalizeValue);
            }
            else
            if (nit.is.arr (v))
            {
                return nit.each (v, normalizeValue);
            }

            return v;
        })
        .staticMethod ("prepareValue", function (v)
        {
            return Self.pg.utils.prepareValue (Self.normalizeValue (v));
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
            id: function (v, jsonPath)
            {
                v = nit.trim (v);

                if (jsonPath)
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

                        return Self.escapeIdentifier (nit.trim (n)) + v.slice (n.length);
                    }
                }
                else
                {
                    let [t, p] = nit.kvSplit (v, ".", true);

                    p = Self.escapeIdentifier (p);

                    return t + (t ? "." : "") + p;
                }
            }
            ,
            literal: function (v)
            {
                return Self.escapeLiteral (Self.prepareValue (v));
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
        .constant ("TYPE_MAPPINGS",
        {
            string: "TEXT",
            boolean: "BOOLEAN",
            number: "NUMERIC (15, 2)",
            integer: "INTEGER",
            object: "JSONB",
            date: "TIMESTAMP WITHOUT TIME ZONE"
        })
        .staticMethod ("registerTypeMapping", function (nitType, dbType)
        {
            Self.TYPE_MAPPINGS[nitType] = dbType;

            return Self;
        })
        .staticMethod ("dbTypeFor", function (nitType, options)
        {
            let t = Self.TYPE_MAPPINGS[nitType];

            options = options instanceof Self.TypeOptions ? options : new Self.TypeOptions (options);

            if (nit.is.func (t))
            {
                t = t (options);
            }

            return t || "TEXT";
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
        .staticMethod ("formatValue", function (v)
        {
            if (nit.is.str (v))
            {
                return nit.toJson (v);
            }
            else
            {
                return v === undefined ? "<undefined>" : (v === null ? "<null>" : nit.serialize (v));
            }
        })
        .staticMethod ("parseValue", function (v)
        {
            return nit.toVal (v);
        })
        .require ("postgresql.TypeOptions")
        .require ("postgresql.Query")
        .require ("postgresql.Command")
        .require ("postgresql.Table")
        .require ("postgresql.Model")
        .require ("postgresql.Id")
        .require ("postgresql.Transform")
    ;
};
