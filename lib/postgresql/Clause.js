module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Clause", "nit.utils.Templatable"))
        .do ("Transforms", Transforms =>
        {
            nit.assign (Transforms, postgresql.TRANSFORMS);
        })
        .staticMethod ("template", function (name, template)
        {
            template = template
                .replace (postgresql.PARAM_PATTERN, postgresql.PATTERN_REPLACERS.literal)
                .replace (postgresql.NAME_PATTERN, postgresql.PATTERN_REPLACERS.id)
            ;

            return Self.superclass.template.call (this, name, template);
        })
        .staticMethod ("sql", function (template)
        {
            return this.template ("sql", template);
        })
        .staticMethod ("defineClause", function (name, superclass, builder)
        {
            ({ name, superclass = Self.name, builder } = nit.typedArgsToObj (arguments,
            {
                name: "string",
                superclass: "string",
                builder: "function"
            }));

            return this.defineInnerClass (name, superclass, builder);
        })
    ;
};
