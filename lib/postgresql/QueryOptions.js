module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.QueryOptions"))
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
        .field ("eager", "boolean", "Load entities with associated objects.")
        .field ("cascade", "boolean", "Save or delete entities with link objects.")
        .field ("relationships...", "string", "Apply the options to the specified relationships only. Use '*' to represent all relationships.", "*")
        .field ("entities", Self.Entities.name, "The entity sets.", () => new Self.Entities)

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

            return new Self (nit.assign ({ entities: options?.entities }, overrides));
        })
    ;
};
