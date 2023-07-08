module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Clause", "nit.utils.Templatable"))
        .staticMethod ("sql", function (template)
        {
            return this.template ("sql", template);
        })
        .onRender (function (template, data)
        {
            return postgresql.format (template, data);
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
