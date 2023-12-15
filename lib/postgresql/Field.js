module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.Model.Field.defineSubclass ("postgresql.Field"))
        .k ("generated", "owner")
        .m ("error.invalid_bind_target", "The field '%{name}' can only be bound to an instance of postgresql.Model.")
        .m ("error.optional_key_field", "The key field '%{field.name}' must be required.")
        .use ("postgresql.Relationship")
        .use ("postgresql.RelationshipPath")

        .defineInnerClass ("RelationshipConstraint", "nit.Constraint", RelationshipConstraint =>
        {
            RelationshipConstraint
                .m ("error.invalid_rel_type_for_array_field", "The '%{relType}' relationship type cannot be assigned to the array field '%{name}'.")
                .m ("error.invalid_rel_type_for_non_array_field", "The '%{relType}' relationship type cannot be assigned to the non-array field '%{name}'.")
                .m ("error.required_array_field_not_allowed", "The array field '%{name}' cannot be required.")
                .m ("error.optional_key_field", "The key field '%{name}' must be required.")
                .onValidate (ctx =>
                {
                    if (ctx.owner[Self.kConstructing])
                    {
                        return true;
                    }

                    const { owner: { relType, array, required, name, key }, constraint } = ctx;

                    if (key && !required)
                    {
                        constraint.throw ("error.optional_key_field", { name });
                    }

                    if (array && required)
                    {
                        constraint.throw ("error.required_array_field_not_allowed", { name });
                    }

                    if (relType)
                    {
                        if (array && relType != "manyToMany" && relType != "oneToMany")
                        {
                            constraint.throw ("error.invalid_rel_type_for_array_field", { relType, name });
                        }

                        if (!array && relType != "oneToOne" && relType != "manyToOne")
                        {
                            constraint.throw ("error.invalid_rel_type_for_non_array_field", { relType, name });
                        }
                    }

                    return true;
                })
            ;
        })

        .staticGetter ("db", "outerClass.db")
        .staticGetter ("registry", "outerClass.registry")
        .staticMemo ("relationshipConstraint", () => new Self.RelationshipConstraint)

        .staticMethod ("createConstructionQueue", function (field, args)
        {
            return Self.superclass.createConstructionQueue.call (this, field, args)
                .complete (function ()
                {
                    field.required = field.required; // eslint-disable-line no-self-assign
                })
            ;
        })
        .staticMethod ("marshallValue", async function (field, value, ctx)
        {
            let row = {};

            if (field.typeIsModel)
            {
                let r = value ? (await field.modelClass.marshall (value, ctx, field)) : {};

                if (field.typeIsId)
                {
                    nit.set (row, field.column, r.value);
                }
                else
                if (value)
                {
                    if (field.modelIsExternal)
                    {
                        for (let kf of field.modelClass.primaryKeyFields)
                        {
                            nit.set (row, field.array ? kf.column : kf.columnNameFor (field), r[kf.column]);
                        }
                    }
                    else
                    {
                        for (let f of field.modelClass.fields)
                        {
                            nit.set (row, field.array ? f.column : f.columnNameFor (field), r[f.column]);
                        }
                    }
                }
            }
            else
            {
                if (value instanceof nit.Object)
                {
                    let cls = value.constructor;

                    value = nit.assign (field.marshallType ? { "@class": cls.name } : {}, value.toPojo ());

                    if (field.marshallType == "compact")
                    {
                        cls.properties.forEach (p =>
                        {
                            if (p.defval === value[p.name])
                            {
                                delete value[p.name];
                            }
                        });
                    }
                }
                else
                {
                    value = nit.clone (value);
                }

                if (field.array)
                {
                    row = value;
                }
                else
                {
                    nit.set (row, field.column, value);
                }
            }

            return row;
        })
        .staticMethod ("unmarshallValue", async function (field, row, options)
        {
            let value = row[field.column];
            let r = {};

            if (field.typeIsModel)
            {
                if (field.typeIsId)
                {
                    return await field.modelClass.unmarshall ({ value }, options);
                }
                else
                if (field.modelIsExtra)
                {
                    if (!nit.is.empty (value))
                    {
                        return await field.modelClass.unmarshall (value, options);
                    }
                }
                else
                if (field.modelIsExternal)
                {
                    for (let kf of field.modelClass.primaryKeyFields)
                    {
                        r[kf.column] = row[kf.columnNameFor (field)];
                    }

                    if (!nit.is.empty.nested (r))
                    {
                        return await field.modelClass.unmarshall (r, options);
                    }
                }
                else
                {
                    if (field.array)
                    {
                        return await field.modelClass.unmarshall (row, options);
                    }
                    else
                    {
                        for (let f of field.modelClass.fields)
                        {
                            r[f.name] = row[f.columnNameFor (field)];
                        }

                        if (!nit.is.empty.nested (r))
                        {
                            return await field.modelClass.unmarshall (r, options);
                        }
                    }
                }
            }
            else
            if (field.array)
            {
                return row;
            }
            else
            if (!nit.is.empty.nested (value))
            {
                return field.primitive ? value : postgresql.parseValue (value);
            }
        })


        .memo ("relationship", true, false, function ()
        {
            return Self.Relationship.new (this);
        })
        .memo ("relationshipPath", true, false, function ()
        {
            return Self.RelationshipPath.new (this);
        })
        .property ("mappedBy", "string") // The field that owns the relationship.
        .property ("key", "boolean", { constraints: Self.relationshipConstraint })
        .property ("required", "boolean", { constraints: Self.relationshipConstraint })
        .property ("relType", "string",
        {
            constraints:
            [
                nit.new ("constraints.Choice", "oneToOne", "oneToMany", "manyToMany", "manyToOne"),
                Self.relationshipConstraint
            ]
        })
        .property ("column", "string")
        .property ("columnType", "string")
        .property ("columnDefval", "string")

        .property ("deleteAction", "string")
        .property ("updateAction", "string")
        .property ("through", "string")
        .property ("transient", "boolean")
        .property ("marshallType", "boolean|string") // true, full, compact

        .getter ("unique", function ()
        {
            return !!this.getConstraint ("postgresql:unique");
        })
        .getter ("typeIsModel", function ()
        {
            let field = this;
            let fc = field.class;

            return !!(fc && nit.is.subclassOf (fc, postgresql.Model));
        })
        .getter ("typeIsId", function ()
        {
            return this.typeIsModel && nit.is.subclassOf (this.modelClass, postgresql.Id, true);
        })
        .getter ("modelClass", function ()
        {
            let field = this;

            if (field.typeIsModel)
            {
                return field.constructor.registry.lookup (field.type);
            }
        })
        .getter ("modelIsExternal", function ()
        {
            let field = this;
            let targetClass = field.target?.constructor;

            return !!targetClass
                && field.typeIsModel
                && !field.modelClass.outerClass
            ;
        })
        .getter ("modelIsReference", function ()
        {
            return this.modelIsExternal && !this.typeIsId;
        })
        .getter ("modelIsExtra", function ()
        {
            return !!this.modelClass?.[postgresql.Model.kExtra];
        })
        .onPostConstruct (function ()
        {
            let field = this;
            let __set = field.set;

            field.column = field.column || field.name;
            field.columnDefval = field.columnDefval || (nit.is.func (field.defval) ? "" : field.defval);

            field.set = function (v)
            {
                let owner = this;

                if (field.typeIsId && nit.is.empty (v))
                {
                    v = new field.modelClass;
                }

                return __set.call (owner, v);
            };

            nit.dpv (field.set, "__set", __set, true, false);
        })
        .method ("columnNameFor", function (...ancestors)
        {
            return ancestors.concat (this).map (f => f.column).join ("_");
        })
        .method ("columnTypeFor", function (options)
        {
            return this.columnType ||  postgresql.dbTypeFor (this.type, options);
        })
        .method ("bind", function (target)
        {
            let field = this;

            if (!(target instanceof postgresql.Model))
            {
                field.throw ("error.invalid_bind_target", field.toPojo ());
            }

            return Self.superclass.prototype.bind.call (field, target);
        })
        .method ("marshall", async function (entity, row, ctx)
        {
            let field = this;
            let value = entity[field.name];

            if (field.array)
            {
                let arr = [];

                for (let v of nit.array (value))
                {
                    arr.push (await Self.marshallValue (field, v, ctx));
                }

                nit.set (row, field.column, arr);
            }
            else
            {
                nit.assign (row, await Self.marshallValue (field, value, ctx));
            }
        })
        .method ("unmarshall", async function (row, entity, options)
        {
            let field = this;
            let data;

            if (field.array)
            {
                data = entity[field.name];

                nit.arrayRemove (data, entity => !field.constructor.outerClass.tagged (entity));

                for (let v of nit.array (row[field.column]))
                {
                    if (!nit.is.undef (v = await Self.unmarshallValue (field, v, options))
                        && (!field.typeIsModel || !data.includes (v)))
                    {
                        data.push (v);
                    }
                }

                entity[field.name] = data;
            }
            else
            if (!nit.is.empty (data = await Self.unmarshallValue (field, row, options)))
            {
                entity[field.name] = data;
            }
        })
    ;
};
