module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineApiPlugin ("Transactional"))
        .k ("begin", "commit", "rollback")
        .onUsedBy (function (hostClass)
        {
            hostClass.configureComponentMethod ("dispatch", Method =>
            {
                Method
                    .after (hostClass.kInitContext, Self.kBegin, (api, ctx) => nit.invoke.return (() => ctx.db.begin ()))
                    .beforeFailure (Self.kRollback, (api, ctx) => nit.invoke.return (() => ctx.db.rollback ()))
                    .beforeSuccess (Self.kCommit, (api, ctx) => nit.invoke.return (() => ctx.db.commit ()))
                ;
            });
        })
    ;
};
