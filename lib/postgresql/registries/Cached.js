module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.registries.Cached", "postgresql.Registry"))
        .staticMemo ("cache", () => new postgresql.Registry)
        .staticMethod ("clearCache", function (modelName)
        {
            if (modelName)
            {
                let model = Self.cache.models[modelName];

                if (model)
                {
                    for (let n in Self.cache.models)
                    {
                        let m = Self.cache.models[n];

                        if (m.name == model.name)
                        {
                            delete Self.cache.models[n];
                        }
                    }
                }
            }
            else
            {
                Self.cache.models = {};
            }

            return Self;
        })
        .method ("lookup", function (name, optional)
        {
            let self = this;
            let Model = Self.cache.lookup (name, optional);

            if (!Model)
            {
                return;
            }

            name = Model.name;

            if (!self.models[name])
            {
                (self.models[name] = Model.defineSubclass (name, true))
                    .defineInnerClass ("Field", "postgresql.Field")
                    .do (NewModel => NewModel.registry = self)
                    .rebuild ()
                ;
            }

            return self.models[name];
        })
    ;
};
