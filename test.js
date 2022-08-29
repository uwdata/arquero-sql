const aq = require('./dist/arquero-sql');
const pg = new aq.db.PostgresDatabase('docker', 'localhost', 'mobilitydb', 'docker', 25432);
pg.getColumnNames('cameras').then(console.log);
pg.executeQuery('SELECT 1 as col1').then(console.log);