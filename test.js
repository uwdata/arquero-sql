const aq = require('./dist/arquero-sql');
const pg = new aq.db.PostgresDatabase('postgres', 'localhost', 'postgres', 'password', 25433);
pg.executeQuery('SELECT 1 as col1').then(console.log);