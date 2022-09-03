import {ArqueroDatabase} from './database/arquero';
import {PostgresDatabase} from './databases/postgres';

export {DBTable} from './db-table';
export {Database, TableView} from './databases';

export {genExpr} from './databases/postgres/visitors/gen-expr';

export const db = {
  Postgres: PostgresDatabase,
  Arquero: ArqueroDatabase,
};
