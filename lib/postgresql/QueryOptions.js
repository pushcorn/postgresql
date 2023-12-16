module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.QueryOptions"))
        .use ("postgresql.queries.Select")
        .defineInnerClass ("EntitySet", EntitySet =>
        {
            EntitySet
                .property ("entities...", "postgresql.Model")
                .property ("tags...", "pojo*")
                .method ("lookup", function (modelClass, pks)
                {
                    pks = modelClass.getHashKeys (pks);

                    if (!nit.is.empty.nested (pks))
                    {
                        return this.entities.find (e => e instanceof modelClass && nit.is.equal (modelClass.getHashKeys (e), pks));
                    }
                })
                .method ("tagFor", function (entity)
                {
                    return this.tags[this.entities.indexOf (entity)];
                })
                .method ("add", function (entity)
                {
                    this.tags.push ({});
                    this.entities.push (entity);

                    return entity;
                })
                .method ("find", function (entity)
                {
                    // The method returns the existing entity if already added; otherwise
                    // the entity will be added and <false> will be returned.

                    return this.lookup (entity.constructor, entity) || !this.add (entity);
                })
            ;
        })
        .defineInnerClass ("Entities", Entities =>
        {
            Entities
                .field ("processed", Self.EntitySet.name, "The processed entities.", () => new Self.EntitySet)
                .field ("marshalled", Self.EntitySet.name, "The marshalled entities.", () => new Self.EntitySet)
                .field ("unmarshalled", Self.EntitySet.name, "The unmarshalled entities.", () => new Self.EntitySet)
            ;
        })
        .defineInnerClass ("Relationship", Relationship =>
        {
            Relationship
                .field ("path", "string", "The path of the relationship.")
                .field ("alias", "string", "The new alias to be use.")
                .field ("filter", "string|postgresql.queries.Select", "The select filters.",
                {
                    setter: function (v)
                    {
                        if (nit.is.str (v))
                        {
                            v = Self.Select ().WhereExpr (v);
                        }

                        return v;
                    }
                })
            ;
        })
        .field ("eager", "boolean", "Load entities with associated objects.")
        .field ("cascade", "boolean", "Save or delete entities with link objects.")
        .field ("relationships...", Self.Relationship.name, "The relationship settings.")
        .field ("aliases", "object", "The table aliases to use when doing join queries. The key is the relationship path and the value is the alias.")
        .field ("entities", Self.Entities.name, "The entity sets.", () => new Self.Entities)

        .memo ("relationshipMap", function ()
        {
            return nit.index (this.relationships, "path");
        })

        .staticMethod ("eager", opts => nit.assign (Self.clone (opts), { eager: true }))
        .staticMethod ("lazy", opts => nit.assign (Self.clone (opts), { eager: false }))
        .staticMethod ("cascade", opts => nit.assign (Self.clone (opts), { cascade: true }))
        .staticMethod ("clone", function (options, overrides)
        {
            ({ options, overrides } = nit.typedArgsToObj (arguments,
            {
                options: Self,
                overrides: "dto"
            }));

            let keep = nit.pick (options, "entities", "relationships");

            return new Self (nit.assign (keep, overrides));
        })
    ;
};
