module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineCommand ("postgresql.commands.CreateMigration"))
        .describe ("Create a database migration file.")
        .m ("info.confirm_creation", "Are you sure you want to create the migration '%{file.path}'?")
        .require ("postgresql.Migration")

        .defineInput (Input =>
        {
            Input
                .option ("<name>", "string", "The migration name.")
                .option ("template", "nit.File", "The migration template file.", postgresql.Migration.options.template)
                .option ("dir", "nit.Dir", "The directory under which the migration should be generated.", postgresql.Migration.options.dir)
                .option ("yes", "boolean", "Create the migration without confirmation.")
            ;
        })
        .staticMethod ("generatePrefix", function ()
        {
            return new Date ().toISOString ().replace (/[^\d]/g, "").slice (0, -3); // eslint-disable-line newline-per-chained-call
        })
        .staticMethod ("sanitizeName", function (name)
        {
            return name.replace (nit.sanitizeVarName.PATTERN, "-");
        })

        .onRun (async function (ctx)
        {
            let { name, template, dir, yes } = ctx.input;

            let sn = Self.sanitizeName (name);
            let filename = `${Self.generatePrefix ()}-${nit.kababCase (sn)}.js`;
            let file = nit.File (dir.join (filename, true));

            if (!yes
                && !await this.confirm ("info.confirm_creation", { file }))
            {
                return;
            }

            let content = nit.Template.render (template.read (), { name: nit.pascalCase (sn) });

            dir.create ();
            file.write (content);
        })
    ;
};
