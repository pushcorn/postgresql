module.exports = function (nit, postgresql, Self)
{
    // Use this class to define the application models, BUT use postgresql.Model.Registry.lookup ()
    // to get fully configured classes at runtime.

    return (Self = nit.defineModel ("postgresql.Model"))
        .k (
            "dbId", "extra",
            "initArgs", "validateEntity", "buildActionContext", "updateRow", "saveRelatedEntities", "returnEntity",
            "insertRow", "deleteRow", "deleteRelatedEntities", "insertOrUpdateEntity"
        )
        .m ("error.entity_not_found", "No matched entity was found. (Matches: %{matches})")
        .m ("error.to_many_field_not_supported", "To-many relationship field is not supported. Use the 'relationship' method instead. (Model: %{model})")
        .use ("postgresql.queries.Select")
        .use ("postgresql.queries.EagerSelect")
        .use ("postgresql.QueryOptions")
        .use ("postgresql.Relationship")
        .use ("postgresql.RelationshipPath")
        .defineMeta ("registry", "postgresql.Registry", () => new postgresql.Registry, true, false)
        .defineMeta ("db", "postgresql.Database", () => new postgresql.Database, true, false)
        .staticProperty ("prefixedTableName", "boolean", true)
        .staticProperty ("tablePrefix", "string", (prop, cls) => cls.name.split (".").shift ())
        .staticProperty ("tableName", "string", (prop, cls) => [cls.prefixedTableName ? cls.tablePrefix : "", nit.pluralize (nit.camelCase (cls.simpleName))].filter (nit.is.not.empty).join ("_"))
        .plugin ("lifecycle-component", "insert", "update", "delete", "save", { pluginName: "Trigger" })
        .categorize ("postgresql.models")
        .defineInnerClass ("Field", "postgresql.Field")
        .do ("Plugin", function (Trigger)
        {
            Trigger.meta ("unique", false);
        })
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
                .field ("[db]", "postgresql.Database", "The current database.")
                .field ("new", Self.name, "The new entity.")
                .field ("old", Self.name, "The old entity.")
                .field ("values", "object", "Field values.")
                .field ("changes", "object", "Changed values.")
                .field ("options", Self.QueryOptions.name, "The query options", () => new Self.QueryOptions)
                .getter ("changed", function ()
                {
                    return !nit.is.empty (this.changes);
                })
            ;
        })
        .defineInnerClass ("ClassTypeParser", ClassTypeParser =>
        {
            ClassTypeParser
                .extend (nit.Object.ClassTypeParser, nit.Class)
                .field ("<registry>", "postgresql.Registry")
                .method ("lookupClass", function (type, required)
                {
                    let cls = nit.lookupClass (type, required);

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
                        for (let f of field.modelClass.marshallableFields)
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

                    table.Column (name, field.columnTypeFor ({ reference: ref }),
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
                        table.Index (name);
                    }
                }
            }

            for (let field of cls.marshallableFields.filter (f => !f.modelIsExtra))
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

                    table.Constraint ("ForeignKey",
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
                        table.Constraint ("Unique", ...columns);
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

                table.Constraint ("unique", ...nit.array (columns, true));
            }

            cls.prepareTable (table);

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
                    cls.prepareJoinTable (joinModelClass.table);

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
            return Self.Select ().From (this).sql;
        })
        .staticMemo ("marshallableFields", function ()
        {
            return this.fields.filter (f => !f.transient);
        })
        .staticMemo ("marshallableFieldMap", function ()
        {
            return nit.index (this.marshallableFields, "name");
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
        .staticTypedMethod ("defineInnerModel",
            {
                name: "string", superclass: "string", builder: "function"
            },
            function (name, superclass = "postgresql.Model", builder)
            {
                return this.defineInnerClass (name, superclass, function (innerClass)
                {
                    builder?.call (this, innerClass);

                    nit.dpg (this, innerClass.simpleName, function ()
                    {
                        return this.registry.lookup (innerClass.name);

                    }, true);
                });
            }
        )
        .staticMethod ("defineExtra", function (builder) // The extra class used to define the extra fields for the join model.
        {
            return this.defineInnerModel ("Extra", Extra =>
            {
                Extra
                    .constant (Self.kExtra, true)
                    .do (Extra => builder.call (this, Extra))
                    .marshallableFields
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
        .staticMethod ("invalidatePropertyCache", function ()
        {
            return Self.superclass.invalidatePropertyCache.apply (this, nit.array (arguments).concat ("marshallableFields", "marshallableFieldMap"));
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

            keyFields = keyFields.length ? keyFields : cls.marshallableFields;

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
        .staticTypedMethod ("find",
            {
                matches: "dto", otherClauses: "string", eager: "boolean", query: "postgresql.queries.Select", options: "postgresql.QueryOptions"
            },
            async function (matches, otherClauses, eager, query, options)
            {
                query = query || new Self.Select;
                query.Limit (1);

                return (await this.select (matches, otherClauses, eager, query, options))[0];
            }
        )
        .staticTypedMethod ("select",
            {
                matches: "dto", otherClauses: "string", eager: "boolean", query: "postgresql.queries.Select", options: "postgresql.QueryOptions"
            },
            async function (matches, otherClauses, eager, query, options)
            {
                options = options || new Self.QueryOptions;
                options.eager = nit.coalesce (eager, options.eager);
                query = query || new Self.Select;

                let cls = this;

                if (!query.froms.length) { query.From (cls); }
                if (matches) { nit.each (nit.pick (await cls.marshallData (matches), cls.table.columnNames), (v, k) => query.Where (k, v)); }
                if (otherClauses) { query.Append (otherClauses); }

                if (options.eager)
                {
                    return await cls.eagerSelect (query, options);
                }
                else
                {
                    return await cls.lazySelect (query, options);
                }
            }
        )
        .staticTypedMethod ("lazySelect",
            {
                query: "postgresql.queries.Select", options: "postgresql.QueryOptions"
            },
            async function (query, options)
            {
                let cls = this;

                return await nit.each (
                    await cls.db.select (query),
                    async (row) => await cls.unmarshall (row, options)
                );
            }
        )
        .staticTypedMethod ("eagerSelect",
            {
                query: "postgresql.queries.Select", options: "postgresql.QueryOptions"
            },
            async function (query, options)
            {
                let cls = this;
                let opts = Self.QueryOptions.clone (options);
                let relPath = cls.relationshipPath;
                let eagerQuery = relPath.toQuery (opts);
                let rows = [];

                if (query && query.sql != cls.selectAllQuery)
                {
                    let t0 = eagerQuery.tables[0];

                    if (!t0.with)
                    {
                        t0.with = query;
                    }
                    else
                    {
                        query.froms = [];
                        t0.with.merge (query);
                    }
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
            }
        )
        .staticMethod ("marshall", async function (entity, ctx)
        {
            let cls = entity.constructor;

            ctx = ctx || new Self.ActionContext;

            let old = ctx.options.entities.marshalled.find (entity);
            let row = ctx.options.entities.marshalled.tagFor (old || entity);

            if (!old)
            {
                await cls.assign (entity, async () =>
                {
                    for (let f of cls.marshallableFields)
                    {
                        await f.marshall (entity, row, ctx);
                    }
                });
            }

            return row;
        })
        .staticTypedMethod ("unmarshall",
            {
                row: "dto", entity: "postgresql.Model", options: "postgresql.QueryOptions"
            },
            async function (row, entity, options)
            {
                let cls = entity?.constructor || this;
                let hasPk = cls.primaryKeyFields.length;

                row = row || {};
                entity = entity || cls.assign (new cls, hasPk && nit.is.subclassOf (cls, Self) ? nit.pick (row, cls.primaryKeyNames) : row);
                options = options || new Self.QueryOptions;
                entity = hasPk && options.entities.unmarshalled.find (entity) || entity;

                return await cls.assign (entity, async () =>
                {
                    for (let f of cls.marshallableFields)
                    {
                        await f.unmarshall (row, entity, options);
                    }

                    cls.tagDbId (entity);
                });
            }
        )
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
        .staticClassChainMethod ("prepareTable") // function (table) {}
        .staticClassChainMethod ("prepareJoinTable") // function (table) {}
        .method ("assign", function (data)
        {
            let entity = this;
            let cls = entity.constructor;

            data = nit.assign ({}, data, v => v !== undefined);

            cls.assign (entity, data);

            return entity;
        })
        .method ("exists", async function ()
        {
            let entity = this;
            let cls = entity.constructor;

            let matches = await cls.getMarshalledPrimaryKeyValues (entity);

            return !!(await cls.find (matches));
        })
        .typedMethod ("load",
            {
                eager: "boolean", options: "postgresql.QueryOptions"
            },
            async function (eager, options)
            {
                options = options || new Self.QueryOptions;
                options.eager = nit.coalesce (eager, options.eager);

                let entity = this;
                let cls = entity.constructor;

                options.entities.unmarshalled.add (entity);

                let matches = await cls.getMarshalledPrimaryKeyValues (entity);
                let old = await cls.load (matches, options);

                return cls.assign (entity, old);
            }
        )
        .configureComponentMethod ("update", Method =>
        {
            Method
                .before (Self.kInitArgs, nit.typedFunc (
                    {
                        entity: Self, data: "dto", cascade: "boolean", options: "postgresql.QueryOptions"
                    },
                    function (entity, data, cascade, options)
                    {
                        options = options || new Self.QueryOptions;
                        options.cascade = nit.coalesce (cascade, options.cascade);

                        this.args = [data, options];
                    }
                ))
                .after ("preUpdate", Self.kValidateEntity, async function (entity, data, options)
                {
                    let cls = entity.constructor;

                    if (options.entities.processed.find (entity))
                    {
                        return this.stop ();
                    }

                    await entity.assign (data);
                    await cls.validate (entity);
                })
                .after (Self.kValidateEntity, Self.kBuildActionContext, async function (entity, data, options)
                {
                    let cls = entity.constructor;
                    let pkMatches = nit.pick (entity, cls.primaryKeyNames);
                    let matches = await cls.marshallData (pkMatches);
                    let old;

                    if (nit.is.empty (matches) || !(old = await cls.find (pkMatches)))
                    {
                        return cls.throw ("error.entity_not_found", { matches: pkMatches });
                    }

                    let ctx = new Self.ActionContext ("update", cls.db, { new: entity, old, options });

                    ctx.values = nit.pick (await cls.marshall (entity, ctx), cls.table.columnNames);
                    ctx.values = nit.omit (ctx.values, nit.keys (matches));
                    ctx.matches = matches;
                    ctx.changes = nit.pick (await cls.marshall (old), cls.table.columnNames);
                    ctx.changes = nit.omit (ctx.changes, nit.keys (matches));

                    nit.each (ctx.values, (v, k) =>
                    {
                        if (nit.is.equal (v, ctx.changes[k]))
                        {
                            delete ctx.changes[k];
                        }
                        else
                        {
                            ctx.changes[k] = v;
                        }
                    });

                    this.args = ctx;
                })
                .after ("update.invokeHook", Self.kUpdateRow, async function (entity, ctx)
                {
                    let cls = entity.constructor;

                    await cls.db.update (cls.tableName, ctx.changed ? ctx.changes : ctx.matches, ctx.matches);

                    cls.tagDbId (entity);
                })
                .after (Self.kUpdateRow, Self.kSaveRelatedEntities, async function (entity, ctx)
                {
                    if (ctx.options.cascade)
                    {
                        await entity.constructor.saveRelatedEntities (entity);
                    }
                })
                .afterComplete (Self.kReturnEntity, entity => entity)
            ;
        })
        .configureComponentMethod ("insert", Method =>
        {
            Method
                .before (Self.kInitArgs, nit.typedFunc (
                    {
                        entity: Self, cascade: "boolean", options: "postgresql.QueryOptions"
                    },
                    function (entity, cascade, options)
                    {
                        options = options || new Self.QueryOptions;
                        options.cascade = nit.coalesce (cascade, options.cascade);

                        this.args = options;
                    }
                ))
                .after ("preInsert", Self.kValidateEntity, async function (entity, options)
                {
                    let cls = entity.constructor;

                    if (options.entities.processed.find (entity))
                    {
                        return this.stop ();
                    }

                    await cls.validate (entity);
                })
                .after (Self.kValidateEntity, Self.kBuildActionContext, async function (entity, options)
                {
                    let cls = entity.constructor;
                    let ctx = new Self.ActionContext ("insert", cls.db, { new: entity, options });
                    let r = await cls.marshall (entity, ctx);

                    ctx.values = nit.pick (r, cls.table.columnNames);

                    this.args = ctx;
                })
                .after ("insert.invokeHook", Self.kInsertRow, async function (entity, ctx)
                {
                    let cls = entity.constructor;

                    await cls.db.insert (cls.tableName, ctx.values);

                    cls.tagDbId (entity);
                })
                .after (Self.kInsertRow, Self.kSaveRelatedEntities, async function (entity, ctx)
                {
                    if (ctx.options.cascade)
                    {
                        await entity.constructor.saveRelatedEntities (entity);
                    }
                })
                .afterComplete (Self.kReturnEntity, entity => entity)
            ;
        })
        .configureComponentMethod ("delete", Method =>
        {
            Method
                .before (Self.kInitArgs, nit.typedFunc (
                    {
                        entity: Self, cascade: "boolean", options: "postgresql.QueryOptions"
                    },
                    function (entity, cascade, options)
                    {

                        options = options || new Self.QueryOptions;
                        options.cascade = nit.coalesce (cascade, options.cascade);

                        this.args = options;
                    }
                ))
                .after ("preDelete", Self.kValidateEntity, async function (entity, options)
                {
                    let cls = entity.constructor;

                    if (options.entities.processed.find (entity))
                    {
                        return this.stop ();
                    }

                    if (!cls.tagged (entity) && !(await entity.exists ()))
                    {
                        return this.stop ();
                    }
                })
                .after (Self.kValidateEntity, Self.kBuildActionContext, async function (entity, options)
                {
                    let cls = entity.constructor;
                    let ctx = new Self.ActionContext ("delete", cls.db, { old: entity, options });

                    ctx.matches = await cls.getMarshalledPrimaryKeyValues (entity);

                    this.args = ctx;
                })
                .after ("delete.invokeHook", Self.kDeleteRow, async function (entity, ctx)
                {
                    let cls = entity.constructor;

                    await cls.db.delete (cls.tableName, ctx.matches);
                })
                .after (Self.kDeleteRow, Self.kDeleteRelatedEntities, async function (entity, ctx)
                {
                    let cls = entity.constructor;

                    if (ctx.options.cascade)
                    {
                        await cls.deleteRelatedEntities (entity);
                    }

                    cls.untagDbId (entity);
                })
                .afterComplete (Self.kReturnEntity, entity => entity)
            ;
        })
        .configureComponentMethod ("save", Method =>
        {
            Method
                .before (Self.kInitArgs, nit.typedFunc (
                    {
                        entity: Self, cascade: "boolean", options: "postgresql.QueryOptions"
                    },
                    function (entity, cascade, options)
                    {
                        options = options || new Self.QueryOptions;
                        options.cascade = nit.coalesce (cascade, options.cascade);

                        this.args = options;
                    }
                ))
                .after ("save.invokeHook", Self.kInsertOrUpdateEntity, async function (entity, options)
                {
                    let cls = entity.constructor;

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
                .afterComplete (Self.kReturnEntity, entity => entity)
            ;
        })
    ;
};
