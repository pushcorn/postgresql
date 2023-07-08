module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Relationship"))
        .k ("owner")
        .m ("error.mapped_by_conflict", "The mappedBy property cannot be assigned to the fields '%{localClass.name}.%{localField.name}' and '%{remoteClass.name}.%{remoteField.name}' at the same time.")
        .m ("error.required_referenced_field", "The referenced field '%{referencedClass.name}.%{referencedField.name}' cannot be required.")
        .m ("error.required_field_conflict", "The fields '%{localClass.name}.%{localField.name}' and '%{remoteClass.name}.%{remoteField.name}' cannot be both required.")
        .m ("error.invalid_mapped_by", "The mappedBy property of '%{referencedClass.name}.%{referencedField.name}' points to an invalid field '%{mappedBy}'.")
        .m ("error.owner_mapped_by_not_allowed", "The mappedBy property of the owner field '%{ownerField.name}' should not be set.")
        .m ("error.array_owner_field_not_allowed", "The owner field '%{ownerClass.name}.%{ownerField.name}' cannot be an array.")

        .constant ("INVERSE_RELATION_TYPE_MAP",
        {
            manyToMany: "manyToMany",
            oneToMany: "manyToOne",
            manyToOne: "oneToMany",
            oneToOne: "oneToOne"

        }, true)

        .field ("<localField>", "nit.Field")
        .field ("<ownerClass>", "function", "The class that owns the relationship.")
        .field ("<ownerField>", "nit.Field", "The field that owns the relationship.")
        .field ("<referencedClass>", "function", "The class that's being referenced.")
        .field ("[referencedField]", "nit.Field", "The field that's being referenced.")
        .field ("remoteField", "nit.Field")

        .getter ("type", "localField.relType")
        .getter ("localClass", function ()
        {
            return this.localField.target.constructor;
        })
        .getter ("remoteClass", function ()
        {
            return this.localField.modelClass;
        })

        .memo ("ownerColumns", r => r.referencedClass
            .primaryKeyFields
            .map (pk => pk.columnNameFor (r.ownerField))
        )
        .memo ("referencedColumns", r => r.referencedClass
            .primaryKeyFields
            .map (pk => pk.column)
        )
        .memo ("joinModelName", r =>
        {
            if (r.type != "manyToMany")
            {
                return;
            }

            const { ownerClass, ownerField, referencedClass, referencedField } = r;

            return ownerField.through
                || referencedField?.through
                || nit.kvSplit (ownerClass.name, ".", true).shift () // namespace
                    + "."
                    + ownerClass.simpleName
                    + nit.ucFirst (ownerField.name)
                    + referencedClass.simpleName
                    + nit.ucFirst (referencedField?.name || nit.pluralize (ownerClass.simpleName))
                    + "Link"
            ;
        })
        .memo ("joinModelClass", r =>
        {
            const { ownerClass, referencedClass, joinModelName } = r;

            if (!joinModelName)
            {
                return;
            }

            if (!nit.lookupClass (joinModelName))
            {
                ownerClass.classChain
                    .find (c => c.name != ownerClass.name && !nit.is.privateClass (c))
                    .defineSubclass (joinModelName)
                    .constant (Self.kOwner, ownerClass.name)
                    .field ("<" + nit.lcFirst (ownerClass.simpleName) + ">", ownerClass.name, { key: true, relType: "manyToOne" })
                    .field ("<" + nit.lcFirst (referencedClass.simpleName) + ">", referencedClass.name, { key: true, relType: "manyToOne" })
                ;
            }

            return ownerClass.registry.lookup (joinModelName);
        })

        .staticMethod ("new", function (field)
        {
            if (!field.modelIsReference)
            {
                return;
            }

            let localField = field;
            let localClass = field.target.constructor;
            let remoteClass = field.modelClass;
            let ownerField;
            let remoteField;

            if (field.mappedBy)
            {
                remoteField = remoteClass.fields.find (f => f.name == field.mappedBy);
            }

            if (!remoteField)
            {
                remoteField = remoteClass.fields.find (f => f.mappedBy == field.name);
            }

            if (!remoteField && localClass != remoteClass)
            {
                remoteField = remoteClass.fields.find (f => f.modelClass?.name == localClass.name);
            }

            if (!remoteField)
            {
                ownerField = localField;
            }
            else
            if (localField.mappedBy && remoteField.mappedBy)
            {
                this.throw ("error.mapped_by_conflict", { localClass, localField, remoteClass, remoteField });
            }
            else
            if (localField.mappedBy)
            {
                ownerField = remoteField;
            }
            else
            if (remoteField.mappedBy)
            {
                ownerField = localField;
            }
            else
            if (localField.required && remoteField.required)
            {
                this.throw ("error.required_field_conflict", { localClass, localField, remoteClass, remoteField });
            }
            else
            if (localField.array && !remoteField.array)
            {
                ownerField = remoteField;
            }
            else
            if (remoteField.array && !localField.array)
            {
                ownerField = localField;
            }
            else
            if ((localField.array && remoteField.array)
                || (!localField.required && !remoteField.required))
            {
                ownerField = [localField, remoteField]
                    .map (f => ({ n: (f == localField ? localClass : remoteClass).simpleName.toLowerCase (), f: f }))
                    .sort ((a, b) => (a.n > b.n ? 1 : -1))
                    .map (o => o.f)
                    .shift ()
                ;
            }
            else
            {
                ownerField = localField.required ? localField : remoteField;
            }

            let ownerClass = ownerField == localField ? localClass : remoteClass;
            let referencedClass = ownerClass == localClass ? remoteClass : localClass;
            let referencedField = ownerField == localField ? remoteField : localField;
            let mappedBy;

            if (ownerField.mappedBy)
            {
                this.throw ("error.owner_mapped_by_not_allowed", { ownerField });
            }

            if (referencedField?.required)
            {
                this.throw ("error.required_referenced_field", { referencedClass, referencedField });
            }

            if ((mappedBy = referencedField?.mappedBy) && !ownerClass.fieldMap[mappedBy])
            {
                this.throw ("error.invalid_mapped_by", { referencedClass, referencedField, mappedBy });
            }

            if (!ownerField.relType)
            {
                if (ownerField.array)
                {
                    if (!referencedField?.array)
                    {
                        this.throw ("error.array_owner_field_not_allowed", { ownerClass, ownerField });
                    }

                    ownerField.relType = "manyToMany";
                }
                else
                {
                    ownerField.relType = referencedField?.array ? "manyToOne" : "oneToOne";
                }
            }

            if (referencedField && !referencedField.relType)
            {
                referencedField.relType = Self.INVERSE_RELATION_TYPE_MAP[ownerField.relType];
            }

            return new Self (localField, ownerClass, ownerField, referencedClass, referencedField, { remoteField });
        })
    ;
};
