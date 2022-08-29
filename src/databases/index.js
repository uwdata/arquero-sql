export {Database} from './database';
export {PostgresDatabase} from './pg-database';

/** @type {import('./database').Database} */
export let defaultDatabase = null;

/**
 * @param {import('./database').Database} database
 */
export function useDatabase(database) {
  defaultDatabase = database;
}