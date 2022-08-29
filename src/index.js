import {SqlQuery} from './sql-query';
export {SqlQuery} from './sql-query';

export const internal = {
    SqlQuery,
};

export * as db from './databases';

export {genExpr} from './visitors/gen-expr';
export {toSql} from './to-sql';
export {optimize} from './optimizer';

// TODO: fromArquero
// TODO: fromArrow
// TODO: fromCSV
// TODO: fromFized
// TODO: fromJSON
// TODO: load, loadArrow, loadCSV, loadFixed, loadJSON
// TODO: bin
// TODO: escape
// TODO: field
// TODO: frac
// TODO: names
// TODO: rolling
// TODO: all, endswith, matches, not, range, startswith
// TODO: agg
// TODO: op
// TODO: query, queryFrom (maybe not?)
// TODO: * from register
// TODO: * from table