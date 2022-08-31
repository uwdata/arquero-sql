/**
 * @param {string} name
 * @param {string[]} expectedWarnMessages
 * @param {string} message
 * @param {(t: object) => any} fn
 * @returns {(t: object) => any}
 */
export function consoleWrapper(name, expectedWarnMessages, message, fn) {
  return function (t) {
    // eslint-disable-next-line no-console
    const consoleFn = console[name];
    const consoleMessages = [];
    // eslint-disable-next-line no-console
    console[name] = m => consoleMessages.push(m);

    fn(t);
    t.deepEquals(consoleMessages, expectedWarnMessages, message);

    // eslint-disable-next-line no-console
    console[name] = consoleFn;

    t.end();
  };
}
