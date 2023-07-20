module.exports = function (nit, postgresql, Self)
{
    const TRANSFORMS = "transforms";

    // Use this class to define the application models, BUT use postgresql.Model.Registry.lookup ()
    // to get fully configured classes at runtime.

    return (Self = nit.defineModel ("postgresql.Model"))
        .k ("dbId", "extra")
        .m ("error.entity_not_found", "No matched entity was found. (Matches: %{matches})")
        .m ("error.to_many_field_not_supported", "To-many relationship field is not supported. Use the 'relationship' method instead. (Model: %{model})")
        .use ("postgresql.Query")
        .use ("postgresql.queries.Select")
        .use ("postgresql.queries.EagerSelect")
        .use ("postgresql.QueryOptions")
        .use ("postgresql.Relationship")
        .use ("postgresql.RelationshipPath")
        .categorize ("postgresql.models")
        .meta ("registry", "postgresql.Registry", () => new postgresql.Registry, true, false)
        .meta ("db", "postgresql.Database", () => new postgresql.Database, true, false)

        .defineInnerClass ("Field", "postgresql.Field")
        .defineValidationContext (ValidationContext =>
        {
            ValidationContext
                .property ("db", "postgresql.Database",
                {
                    getter: function (db)
                    {
                        return db || nit.get (this, "entity.constructor.db") || Self.db;
                    }
                })
            ;
        })
        .defineInnerClass ("ActionContext", ActionContext =>
        {
            ActionContext
                .field ("[action]", "string", "The action that caused the marshalling.", "none")
                    .constraint ("choice", "update", "insert", "delete", "none")
                .field ("new", Self.name, "The new entity.")
                .field ("old", Self.name, "The old entity.")
                .field ("values", "object")
                .field ("matches", "object")
                .field ("options", Self.QueryOptions.name, "The query options", () => new Self.QueryOptions)
            ;
        })
        .defineInnerClass ("ClassTypeParser", ClassTypeParser =>
        {
            ClassTypeParser
                .extend (nit.Object.ClassTypeParser, nit.Class)
                .field ("<registry>", "postgresql.Registry")

                .method ("supports", function (type)
                {
                    return !!nit.lookupClass (type);
                })
                .method ("lookupClass", function (type)
                {
                    let cls = nit.lookupClass (type);

                    if (nit.is.subclassOf (cls, Self))
                    {
                        return this.registry.lookup (type);
                    }
                    else
                    {
                        return cls;
                    }
                })
                .method ("new", function (cls, v)
                {
                    return nit.is.subclassOf (cls, Self) ? cls.new (v) : new cls (v);
                })
            ;
        })

        .staticMemo ("tableName", function ()
        {
            return nit.pluralize (nit.camelCase (this.simpleName));
        })
        .staticMemo ("table", function ()
        {
            let cls = this;
            let table = nit.new ("postgresql.Table", cls.tableName);

            table.db = cls.db;

            function addColumn (field, ...ancestors)
            {
                if (field.typeIsModel && !field.typeIsId && (!field.array || field.modelIsExternal))
                {
                    if (field.modelIsExternal)
                    {
                        if (field.relationship.ownerField == field)
                        {
                            for (let kf of field.modelClass.primaryKeyFields)
                            {
                                addColumn (kf, ...ancestors, field);
                            }
                        }
                    }
                    else
                    {
                        for (let f of field.modelClass.fields)
                        {
                            addColumn (f, ...ancestors, field);
                        }
                    }
                }
                else
                {
                    let path = ancestors.concat (field);
                    let parent = ancestors.slice (-1)[0];
                    let ref = parent && parent.modelIsExternal;
                    let name = field.columnNameFor (...ancestors);

                    table.$column (name, field.columnTypeFor ({ reference: ref }),
                    {
                        primaryKey: parent ? parent.key : field.key,
                        array: field.array,
                        unique: path.some (f => f.unique),
                        nullable: parent ? !parent.required : !field.required,
                        defval: field.columnDefval || !parent && field.typeIsId && field.modelClass.fieldMap.value.columnDefval || ""
                    });

                    if (ref
                        && cls.primaryKeyNames[0] != parent.name // skip the first primary key
                        && parent.relationship?.type != "oneToOne")
                    {
                        table.$index (name);
                    }
                }
            }

            for (let field of cls.fields.filter (f => !f.transient && !f.modelIsExtra))
            {
                let { ownerField, referencedClass, type } = field.relationship || {};

                if (type == "manyToMany")
                {
                    continue;
                }

                addColumn (field);

                if (ownerField == field)
                {
                    let columns = referencedClass.primaryKeyFields.map (pk => pk.columnNameFor (field));

                    table.$constraint ("ForeignKey",
                    {
                        columns,
                        deferred: true,
                        referencedTable: referencedClass.tableName,
                        referencedColumns: referencedClass.primaryKeyFields.map (pk => pk.column),
                        deleteAction: field.deleteAction || (field.required ? "CASCADE" : "SET NULL"),
                        updateAction: field.updateAction || (field.required ? "CASCADE" : "SET NULL")
                    });

                    if (!field.key && type == "oneToOne")
                    {
                        table.$constraint ("Unique", ...columns);
                    }
                }
            }

            for (let uniqueCheck of cls.getChecks ("postgresql:unique"))
            {
                let columns = uniqueCheck.fields.map (n =>
                {
                    let f = cls.fieldMap[n];

                    return f.modelIsExternal ? f.modelClass.primaryKeyFields.map (kf => kf.columnNameFor (f)) : f.column;
                });

                table.$constraint ("unique", ...nit.array (columns, true));
            }

            return table;
        })
        .staticMemo ("joinTables", function ()
        {
            let cls = this;
            let tables = [];

            for (let field of cls.fields)
            {
                let joinModelClass = field.relationship?.joinModelClass;

                if (joinModelClass?.[Self.Relationship.kOwner] == cls.name)
                {
                    tables.push (joinModelClass.table);
                }
            }

            return tables;
        })
        .staticMemo ("tables", function ()
        {
            return [this.table, ...this.joinTables];
        })
        .staticMemo ("classTypeParser", function ()
        {
            return new Self.ClassTypeParser (this.registry);
        })
        .staticMemo ("relationshipPath", function ()
        {
            let cls = this;
            let path = new Self.RelationshipPath (
            {
                models: [{ class: cls, alias: "t0" }]
            });

            for (let field of cls.fields.filter (f => f.relationship))
            {
                path.append (field.relationshipPath);
            }

            return path;
        })
        .staticMemo ("selectAllQuery", function ()
        {
            return Self.Select ().$from (this).sql;
        })

        .staticGetter ("primaryKeyFields", function ()
        {
            return this.fields.filter (f => f.key);
        })
        .staticGetter ("primaryKeyNames", function ()
        {
            return this.primaryKeyFields.map (f => f.name);
        })
        .staticGetter ("uniqueKeyFieldGroups", function ()
        {
            let cls = this;
            let groups = cls.fields.filter (f => f.unique).map (f => [f]);

            for (let uniqueCheck of cls.getChecks ("postgresql:unique"))
            {
                groups.push (uniqueCheck.fields.map (n => cls.fieldMap[n]));
            }

            return groups;
        })
        .staticGetter ("uniqueKeyNameGroups", function ()
        {
            let cls = this;

            return cls.uniqueKeyFieldGroups
                .map (fields => fields.map (f => f.name))
            ;
        })

        .staticMethod ("defineInnerModel", function (name, builder)
        {
            return this.defineInnerClass (name, "postgresql.Model", function (innerClass)
            {
                builder?.call (this, innerClass);

                nit.dpg (this, innerClass.simpleName, function ()
                {
                    return this.registry.lookup (innerClass.name);

                }, true);
            });
        })
        .staticMethod ("defineExtra", function (builder) // The extra class used to define the extra fields for the join model.
        {
            return this.defineInnerModel ("Extra", Extra =>
            {
                Extra
                    .constant (Self.kExtra, true)
                    .do (Extra => builder.call (this, Extra))
                    .fields
                        .forEach (f => this.field (f.toPojo ()))
                ;
            });
        })
        .staticMethod ("tagDbId", function (entity)
        {
            nit.dpv (entity, Self.kDbId, this.db.id, true, false);
        })
        .staticMethod ("untagDbId", function (entity)
        {
            delete entity[Self.kDbId];
        })
        .staticMethod ("tagged", function (entity)
        {
            return entity[Self.kDbId] == this.db.id;
        })
        .staticMethod ("rebuild", function ()
        {
            let cls = this;

            for (let f of cls.fields)
            {
                f = cls.Field (nit.omit (f.toPojo (true), "get", "set")).bind (cls.prototype);

                if (!f.primitive)
                {
                    f.parser = cls.classTypeParser;
                }
            }

            return cls.invalidatePropertyCache ();
        })
        .staticMethod ("getPrimaryKeyValues", function (entity)
        {
            let cls = this;

            return nit.pick (entity, cls.primaryKeyNames);
        })
        .staticMethod ("getMarshalledPrimaryKeyValues", async function (entity)
        {
            let cls = this;

            return await cls.marshallData (cls.getPrimaryKeyValues (entity));
        })
        .staticMethod ("getUniqueKeyValueGroups", function (entity)
        {
            let cls = this;
            let groups = [];

            for (let names of cls.uniqueKeyNameGroups)
            {
                groups.push (nit.pick (entity, names));
            }

            return groups;
        })
        .staticMethod ("getHashKeys", function (entity)
        {
            let cls = this;
            let keys = {};
            let keyFields = cls.primaryKeyFields;

            if (!(entity instanceof cls))
            {
                entity = new cls (entity);
            }

            keyFields = keyFields.length ? keyFields : cls.fields;

            for (let f of keyFields)
            {
                let v = entity[f.name];

                if (nit.is.empty (v) || v === f.defval)
                {
                    continue;
                }

                if (f.typeIsModel)
                {
                    let hks = f.modelClass.getHashKeys (v);

                    if (nit.is.empty.nested (hks))
                    {
                        continue;
                    }

                    if (f.typeIsId)
                    {
                        keys[f.name] = hks.value + "";
                    }
                    else
                    {
                        for (let k in hks)
                        {
                            keys[f.name + "_" + k] = hks[k] + "";
                        }
                    }
                }
                else
                {
                    keys[f.name] = v + "";
                }
            }

            return keys;
        })
        .staticMethod ("marshallData", async function (data)
        {
            let cls = this;
            let entity = cls.assign (new cls, data);
            let values = {};
            let ctx = new Self.ActionContext;

            for (let n in data)
            {
                let f = cls.fieldMap[n];

                if (f)
                {
                    await f.marshall (entity, values, ctx);
                }
            }

            return nit.assign ({}, nit.pick (values, cls.table.columnNames), nit.is.not.empty);
        })
        .staticMethod ("create", async function (...args) // eslint-disable-line no-unused-vars
        {
            let cls = this;
            let options = args[args.length - 1] instanceof Self.QueryOptions ? args.pop () : undefined;
            let entity = new cls (...args);

            return await entity.insert (options);
        })
        .staticMethod ("get", async function (...values) // get by key values
        {
            let cls = this;
            let options = values[values.length - 1] instanceof Self.QueryOptions ? values.pop () : undefined;
            let matches = nit.arrayCombine (cls.primaryKeyNames, values);

            return await cls.find (matches, options);
        })
        .staticMethod ("load", async function (matches, otherClauses, query, options) // eslint-disable-line no-unused-vars
        {
            let cls = this;

            return (await cls.find (...arguments)) || cls.throw ("error.entity_not_found", { matches });
        })
        .staticMethod ("find", async function (matches, otherClauses, query, options)
        {
            ({ matches, otherClauses, query, options } = nit.typedArgsToObj (arguments,
            {
                matches: "dto",
                otherClauses: "string",
                query: Self.Select,
                options: [Self.QueryOptions, "boolean"]
            }));

            query = query || new Self.Select;
            query.$limit (1);

            return (await this.select (matches, otherClauses, query, options))[0];
        })
        .staticMethod ("select", async function (matches, otherClauses, eager, query, options)
        {
            ({ matches, otherClauses, eager, query, options } = nit.typedArgsToObj (arguments,
            {
                matches: "dto",
                otherClauses: "string",
                eager: "boolean",
                query: Self.Select,
                options: Self.QueryOptions
            }));

            options = options || new Self.QueryOptions ({ eager });
            query = query || new Self.Select;

            let cls = this;

            if (!query.froms.length) { query.$from (cls); }
            if (matches) { nit.each (nit.pick (await cls.marshallData (matches), cls.table.columnNames), (v, k) => query.$where (k, v)); }
            if (otherClauses) { query.$append (otherClauses); }

            if (options.eager)
            {
                return await cls.eagerSelect (query, options);
            }
            else
            {
                return await cls.lazySelect (query, options);
            }
        })
        .staticMethod ("lazySelect", async function (query, options)
        {
            ({ query, options } = nit.typedArgsToObj (arguments,
            {
                query: Self.Select,
                options: Self.QueryOptions
            }));

            let cls = this;

            return await nit.each (
                await cls.db.select (query),
                async (row) => await cls.unmarshall (row, options)
            );
        })
        .staticMethod ("eagerSelect", async function (query, options)
        {
            ({ query, options } = nit.typedArgsToObj (arguments,
            {
                query: Self.Select,
                options: Self.QueryOptions
            }));

            let cls = this;
            let opts = Self.QueryOptions.clone (options);
            let relPath = cls.relationshipPath;
            let eagerQuery = relPath.toQuery ();
            let rows = [];

            if (query && query.sql != cls.selectAllQuery)
            {
                eagerQuery.tables[0].with = query;
            }

            for (let row of await cls.db.fetchAll (eagerQuery))
            {
                row = await relPath.unmarshall (row, opts);

                if (!rows.includes (row))
                {
                    rows.push (row);
                }
            }

            return rows;
        })
        .staticMethod ("marshall", async function (entity, ctx, field)
        {
            let cls = entity.constructor;

            ctx = ctx || new Self.ActionContext;

            let old = ctx.options.entities.marshalled.find (entity);
            let row = ctx.options.entities.marshalled.tagFor (old || entity);

            if (!old)
            {
                await cls.assign (entity, async () =>
                {
                    await cls.applyPlugins (TRANSFORMS, "preMarshall", entity, row, ctx, field);

                    for (let f of cls.fields)
                    {
                        await f.marshall (entity, row, ctx);
                    }

                    await cls.applyPlugins (TRANSFORMS, "postMarshall", entity, row, ctx, field);
                });
            }

            return row;
        })
        .staticMethod ("unmarshall", async function (row, entity, options)
        {
            ({ row, entity, options } = nit.typedArgsToObj (arguments,
            {
                row: "dto",
                entity: "postgresql.Model",
                options: Self.QueryOptions
            }));

            let cls = entity?.constructor || this;
            let hasPk = cls.primaryKeyFields.length;

            row = row || {};
            entity = entity || cls.assign (new cls, hasPk && nit.is.subclassOf (cls, Self) ? nit.pick (row, cls.primaryKeyNames) : row);
            options = options || new Self.QueryOptions;
            entity = hasPk && options.entities.unmarshalled.find (entity) || entity;

            return await cls.assign (entity, async () =>
            {
                await cls.applyPlugins (TRANSFORMS, "preUnmarshall", row, entity, options);

                for (let f of cls.fields)
                {
                    await f.unmarshall (row, entity, options);
                }

                await cls.applyPlugins (TRANSFORMS, "postUnmarshall", row, entity, options);

                cls.tagDbId (entity);
            });
        })
        .staticMethod ("saveRelatedEntities", async function (entity)
        {
            let cls = this;

            for (let field of cls.fields.filter (f => f.modelIsReference))
            {
                let { ownerField, joinModelClass: joinModel } = field.relationship;

                for (let v of nit.array (entity[field.name]))
                {
                    if (!joinModel
                        && ownerField != field
                        && !v[ownerField.name])
                    {
                        v[ownerField.name] = entity;
                    }

                    await v.save ();

                    if (joinModel)
                    {
                        let data = {};
                        let extraField;

                        joinModel.primaryKeyFields.forEach (pk =>
                        {
                            data[pk.name] = pk.class == cls ? entity : v;
                        });

                        if (joinModel.Extra
                            && (extraField = cls.fields.find (f => f.class == joinModel.Extra)))
                        {
                            nit.assign (data, v[extraField.name]);
                        }

                        await joinModel.new (data).save ();
                    }
                }
            }
        })
        .staticMethod ("deleteRelatedEntities", async function (entity)
        {
            let cls = this;

            for (let fld of cls.fields.filter (f => f.modelIsExternal && !f.typeIsId))
            {
                await entity[fld.name].delete ();
            }
        })
        .staticLifecycleMethod ("preInsert", async function (ctx)
        {
            let cls = this;

            await cls.applyPlugins (TRANSFORMS, "preInsert", ctx);
            await cls[cls.kPreInsert]?. (ctx);
        })
        .staticLifecycleMethod ("postInsert", async function (ctx)
        {
            let cls = this;

            await cls[cls.kPostInsert]?. (ctx);
            await cls.applyPlugins (TRANSFORMS, "postInsert", ctx);
        })
        .staticLifecycleMethod ("preUpdate", async function (ctx)
        {
            let cls = this;

            await cls.applyPlugins (TRANSFORMS, "preUpdate", ctx);
            await cls[cls.kPreUpdate]?. (ctx);
        })
        .staticLifecycleMethod ("postUpdate", async function (ctx)
        {
            let cls = this;

            await cls[cls.kPostUpdate]?. (ctx);
            await cls.applyPlugins (TRANSFORMS, "postUpdate", ctx);
        })
        .staticLifecycleMethod ("preDelete", async function (ctx)
        {
            let cls = this;

            await cls.applyPlugins (TRANSFORMS, "preDelete", ctx);
            await cls[cls.kPreDelete]?. (ctx);
        })
        .staticLifecycleMethod ("postDelete", async function (ctx)
        {
            let cls = this;

            await cls[cls.kPostDelete]?. (ctx);
            await cls.applyPlugins (TRANSFORMS, "postDelete", ctx);
        })
        .method ("exists", async function ()
        {
            let entity = this;
            let cls = entity.constructor;

            let matches = await cls.getMarshalledPrimaryKeyValues (entity);

            return !!(await cls.find (matches));
        })
        .method ("load", async function (eager, options)
        {
            ({ eager, options } = nit.typedArgsToObj (arguments,
            {
                eager: "boolean",
                options: Self.QueryOptions
            }));

            options = options || new Self.QueryOptions ({ eager });

            let entity = this;
            let cls = entity.constructor;

            options.entities.unmarshalled.add (entity);

            let matches = await cls.getMarshalledPrimaryKeyValues (entity);
            let old = await cls.load (matches, options);

            return cls.assign (entity, old);
        })
        .lifecycleMethod ("update", async function (data, cascade, options)
        {
            ({ data, cascade = false, options } = nit.typedArgsToObj (arguments,
            {
                data: "dto",
                cascade: "boolean",
                options: Self.QueryOptions
            }));

            options = options || new Self.QueryOptions ({ cascade });

            let entity = this;
            let cls = entity.constructor;

            if (options.entities.processed.find (entity))
            {
                return entity;
            }

            if (data)
            {
                await cls.assign (entity, data);
            }

            await cls.validate (entity);

            let pkMatches = nit.pick (entity, cls.primaryKeyNames);
            let matches = await cls.marshallData (pkMatches);
            let old;

            if (nit.is.empty (matches) || !(old = await cls.find (pkMatches)))
            {
                return cls.throw ("error.entity_not_found", { matches: pkMatches });
            }

            let ctx = new Self.ActionContext ("update", { new: entity, old, options });

            ctx.values = nit.pick (await cls.marshall (entity, ctx), cls.table.columnNames);
            ctx.values = nit.omit (ctx.values, nit.keys (matches));
            ctx.matches = matches;

            await cls.preUpdate (ctx);
            await cls[cls.kUpdate]?.call (entity, ctx);
            await cls.db.update (cls.tableName, ctx.values, ctx.matches);

            cls.tagDbId (entity);

            if (options.cascade)
            {
                await cls.saveRelatedEntities (entity);
            }

            await cls.postUpdate (ctx);

            return entity;
        })
        .lifecycleMethod ("insert", async function (cascade, options)
        {
            ({ cascade = false, options } = nit.typedArgsToObj (arguments,
            {
                cascade: "boolean",
                options: Self.QueryOptions
            }));

            options = options || new Self.QueryOptions ({ cascade });

            let entity = this;
            let cls = entity.constructor;

            if (options.entities.processed.find (entity))
            {
                return entity;
            }

            await cls.validate (entity);

            let ctx = new Self.ActionContext ("insert", { new: entity, options });

            let r = await cls.marshall (entity, ctx);

            ctx.values = nit.pick (r, cls.table.columnNames);

            await cls.preInsert (ctx);
            await cls[cls.kInsert]?.call (entity, ctx);
            await cls.db.insert (cls.tableName, ctx.values);

            cls.tagDbId (entity);

            if (options.cascade)
            {
                await cls.saveRelatedEntities (entity);
            }

            await cls.postInsert (ctx);

            return entity;
        })
        .lifecycleMethod ("delete", async function (cascade, options)
        {
            ({ cascade = false, options } = nit.typedArgsToObj (arguments,
            {
                cascade: "boolean",
                options: Self.QueryOptions
            }));

            options = options || new Self.QueryOptions ({ cascade });

            let entity = this;
            let cls = entity.constructor;

            if (options.entities.processed.find (entity))
            {
                return entity;
            }

            if (!cls.tagged (entity) && !(await entity.exists ()))
            {
                return entity;
            }

            let ctx = new Self.ActionContext ("delete", { old: entity, options });

            ctx.matches = await cls.getMarshalledPrimaryKeyValues (entity);

            await cls.preDelete (ctx);
            await cls[cls.kDelete]?.call (entity, ctx);
            await cls.db.delete (cls.tableName, ctx.matches);

            if (options.cascade)
            {
                await cls.deleteRelatedEntities (entity);
            }

            cls.untagDbId (entity);
            await cls.postDelete (ctx);

            return entity;
        })
        .lifecycleMethod ("save", async function (cascade, options)
        {
            ({ cascade = false, options } = nit.typedArgsToObj (arguments,
            {
                cascade: "boolean",
                options: Self.QueryOptions
            }));

            options = options || new Self.QueryOptions ({ cascade });

            let entity = this;
            let cls = entity.constructor;

            await cls[cls.kSave]?.call (entity, options);

            if (cls.tagged (entity))
            {
                return await entity.update (options);
            }
            else
            {
                let pkMatches = nit.pick (entity, cls.primaryKeyNames);
                let old;

                if (!nit.is.empty (await cls.marshallData (pkMatches))
                    && (await cls.find (pkMatches)))
                {
                    return await entity.update (options);
                }

                for (let ukMatches of cls.getUniqueKeyValueGroups (entity))
                {
                    if ((old = await cls.find (ukMatches, options)))
                    {
                        cls.assign (entity, nit.pick (old, cls.primaryKeyNames));

                        return await entity.update (options);
                    }
                }

                return await entity.insert (options);
            }
        })
    ;
};
