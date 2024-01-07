module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineApiPlugin ("Transactional"))
        .k ("begin", "commit", "rollback")
        .onUsedBy (function (hostClass)
        {
            hostClass.configureComponentMethod ("dispatch", Method =>
            {
                Method
                    .after ("initArgs", Self.kBegin, (api, ctx) => ctx.db.begin ())
                    .beforeFailure (Self.kRollback, (api, ctx) => ctx.db.rollback ())
                    .beforeSuccess (Self.kCommit, (api, ctx) => ctx.db.commit ())
                ;
            });
        })
    ;
};
