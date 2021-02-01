export const ARQUERO_SQL_PREFIX = '___arquero_sql_';
export const ARQUERO_SQL_SUFFIX = '___';

/**
 *
 * @param {string} name
 */
export default function (name) {
  return name.startsWith(ARQUERO_SQL_PREFIX) && name.endsWith(ARQUERO_SQL_SUFFIX);
}
