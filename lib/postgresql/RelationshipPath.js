module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.RelationshipPath"))
        .use ("postgresql.queries.Select")
        .use ("postgresql.queries.EagerSelect")
        .use ("postgresql.QueryOptions")

        .defineInnerClass ("Link", Link =>
        {
            Link
                .field ("<from>", "string")
                .field ("<to>", "string")
            ;
        })
        .defineInnerClass ("Model", Model =>
        {
            Model
                .field ("<class>", "function")
                .field ("<alias>", "string")
                .field ("[owner]", "string", "The alias of the owner")
                .field ("[relType]", "string")
                .field ("[field]", "string")
                .field ("[remoteField]", "string")
                .field ("ownerClass", "function")
                .field ("extraClass", "function")
                .field ("extraField", "string")
                .field ("joins...", Self.Link.name)
                .field ("linkColumns...", Self.Link.name)
                .field ("inverseLinkColumns...", Self.Link.name)
                .getter ("path", function ()
                {
                    if (this.ownerClass)
                    {
                        return this.ownerClass.simpleName + "." + this.field;
                    }
                    else
                    {
                        return this.class.simpleName;
                    }
                })
            ;
        })

        .field ("<models...>", Self.Model.name)
        .field ("[type]", "string")

        .memo ("modelsByAlias", function ()
        {
            return nit.index (this.models, "alias");
        })

        .staticMethod ("new", function (field)
        {
            let rel = field.relationship;

            if (!rel)
            {
                return;
            }

            const { localClass, remoteClass, joinModelClass, ownerField, remoteField } = rel;

            let models = [];
            let owner = "";

            models.push (
            {
                class: localClass,
                owner: owner,
                alias: (owner = "t" + models.length)
            });

            if (joinModelClass)
            {
                let localJoinField = joinModelClass.fields.find (f => f.relationship?.remoteClass == localClass);
                let remoteJoinField = joinModelClass.fields.find (f => f.relationship?.remoteClass == remoteClass);

                models.push (
                {
                    class: joinModelClass,
                    owner: owner,
                    ownerClass: localClass,
                    alias: (owner = "t" + models.length),
                    relType: rel.type,
                    field: field.name,
                    linkColumns: localClass.primaryKeyFields.map (kf => ({ from: kf.column, to: kf.columnNameFor (localJoinField) })),
                    inverseLinkColumns: remoteClass.primaryKeyFields.map (kf => ({ from: kf.columnNameFor (remoteJoinField), to: kf.columnNameFor (field) })),
                    joins: nit.arrayCombine.nested (
                        ["from", "to"],
                        [localJoinField.relationship.referencedColumns, localJoinField.relationship.ownerColumns]
                    )
                });

                models.push (
                {
                    class: remoteJoinField.modelClass,
                    owner: owner,
                    ownerClass: joinModelClass,
                    alias: "t" + models.length,
                    relType: remoteJoinField.relationship?.type,
                    field: remoteJoinField.name,
                    extraClass: joinModelClass.Extra,
                    extraField: joinModelClass.Extra && remoteJoinField.modelClass.fields.find (f => f.class == joinModelClass.Extra)?.name,
                    linkColumns: remoteClass.primaryKeyFields.map (kf => ({ from: kf.columnNameFor (remoteJoinField), to: kf.column })),
                    inverseLinkColumns: remoteClass.primaryKeyFields.map (kf => ({ from: kf.column, to: kf.columnNameFor (remoteJoinField) })),
                    joins: nit.arrayCombine.nested (
                        ["from", "to"],
                        [remoteJoinField.relationship.ownerColumns, remoteJoinField.relationship.referencedColumns]
                    )
                });
            }
            else
            {
                let isOwner = ownerField == field;

                models.push (
                {
                    class: remoteClass,
                    owner: owner,
                    ownerClass: localClass,
                    alias: "t" + models.length,
                    relType: rel.type,
                    field: field.name,
                    remoteField: remoteField?.name,
                    linkColumns: remoteField && localClass.primaryKeyFields.map (kf => ({ from: kf.column, to: kf.columnNameFor (remoteField) })) || [],
                    inverseLinkColumns: remoteClass.primaryKeyFields.map (kf => ({ from: kf.column, to: kf.columnNameFor (field) })),
                    joins: nit.arrayCombine.nested (
                        isOwner ? ["from", "to"] : ["to", "from"],
                        [rel.ownerColumns, rel.referencedColumns]
                    )
                });
            }

            return new Self ({ type: rel.type, models });
        })

        .method ("toQuery", function (options)
        {
            options = options || new Self.QueryOptions;

            let models = this.models;
            let newAliases = {};

            nit.each (models, model =>
            {
                newAliases[model.alias] = options.relationshipMap[model.path]?.alias || model.alias;
            });

            nit.each (models, model =>
            {
                model.alias = newAliases[model.alias];
                model.owner = newAliases[model.owner];
            });

            let query = new Self.EagerSelect;

            for (let model of models)
            {
                let topts = {};
                let filter = options.relationshipMap[model.path]?.filter;

                if (filter)
                {
                    topts.with = Self.Select ()
                        .From (model.class.table.name)
                        .merge (filter)
                    ;
                }

                query.Table (model.class.table, model.alias, topts);

                model.joins.forEach (j => query.On (j.from, j.to, model.owner));
            }

            return query;
        })
        .method ("append", function (path)
        {
            let models = this.models;

            for (let pm of path.models)
            {
                let owner = models.find (m => m.class == pm.ownerClass);

                if (owner)
                {
                    pm = nit.clone (pm);
                    pm.alias = "t" + models.length;
                    pm.owner = owner.alias;

                    models.push (pm);
                }
            }
        })
        .method ("unmarshall", async function (row, options)
        {
            ({ row, options } = nit.typedArgsToObj (arguments,
            {
                row: "dto",
                options: Self.QueryOptions
            }));

            let { modelsByAlias } = this;
            let entitiesByAlias = {};

            options = options || new Self.QueryOptions;

            for (let n in row)
            {
                let [alias, field] = nit.kvSplit (n, "_");
                let e = entitiesByAlias[alias] = entitiesByAlias[alias] || {};

                e[field] = row[n];
            }

            for (let alias in entitiesByAlias)
            {
                let m = modelsByAlias[alias];
                let e = entitiesByAlias[alias];
                let o = entitiesByAlias[m.owner];

                if (o)
                {
                    m.linkColumns.forEach (l =>
                    {
                        if (m.relType == "manyToOne")
                        {
                            e[m.remoteField] = { [l.to]: o[l.from] };
                        }
                        else
                        if (!(l.to in e))
                        {
                            e[l.to] = o[l.from];
                        }
                    });

                    m.inverseLinkColumns.forEach (l =>
                    {
                        if (m.relType.endsWith ("Many"))
                        {
                            o[m.field] = { [l.to]: e[l.from] };
                        }
                        else
                        if (!(l.to in o))
                        {
                            o[l.to] = e[l.from];
                        }
                    });

                    if (m.extraField)
                    {
                        e[m.extraField] = nit.each.obj (m.extraClass.fieldMap, f => o[f.name]);
                    }
                }
            }

            for (let alias in entitiesByAlias)
            {
                let m = modelsByAlias[alias];

                entitiesByAlias[alias] = await m.class.unmarshall (entitiesByAlias[alias], options);
            }

            return entitiesByAlias[this.models[0].alias];
        })
    ;
};
