import {ArqueroDatabase, ArqueroTableView} from './databases/arquero';
import {PostgresDatabase, PostgresTableView} from './databases/postgres';

export {DBTable} from './db-table';
export {Database, TableView} from './databases';

export {genExpr} from './databases/postgres/visitors/gen-expr';

export const db = {
  Postgres: PostgresDatabase,
  Arquero: ArqueroDatabase,
};

export const tableView = {
  Postgres: PostgresTableView,
  Arquero: ArqueroTableView,
};
