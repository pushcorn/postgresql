module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Registry")
        .property ("models", "object", { enumerable: false })
        .method ("lookup", function (name)
        {
            let self = this;
            let Model = self.models[name] || nit.lookupComponent (name, "models", "postgresql.Model");
            let cn = Model.name;

            if (!self.models[cn])
            {
                (self.models[cn] = self.models[name] = Model.defineSubclass (cn, true))
                    .defineInnerClass ("Field", "postgresql.Field")
                    .do (NewModel => NewModel.registry = self)
                    .rebuild ()
                ;
            }
            else
            {
                self.models[name] = self.models[cn];
            }

            return self.models[cn];
        })
    ;
};
