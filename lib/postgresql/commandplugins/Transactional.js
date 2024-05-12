module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineCommandPlugin ("Transactional"))
        .k ("begin", "commit", "rollback")
        .onUsedBy (function (hostClass)
        {
            hostClass.configureComponentMethod ("run", Method =>
            {
                Method
                    .after (hostClass.kInitContext, Self.kBegin, (api, ctx) => nit.invoke.return (() => ctx.db.begin ()))
                    .beforeFailure (Self.kRollback, (cmd, ctx) => nit.invoke.return (() => ctx.db?.rollback ()))
                    .beforeSuccess (Self.kCommit, (cmd, ctx) => nit.invoke.return (() => ctx.db?.commit ()))
                ;
            });
        })
    ;
};
