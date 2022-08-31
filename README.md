# Arquero-SQL
[Arquero](https://github.com/uwdata/arquero) is a query processing JavaScript library.
So, your local machine memory is its limitation when dealing with large amount of data.
Arquero-SQL is a SQL backend support for Arquero.
Using the same syntax as Arquero in JavaScript, Aquero-SQL use your SQL server as an execution engine for transforming your data table.
With Arquero-SQL, your data is stored in a disk and can be transformed with a powerful remote machine, suited for big data analysis tasks.

Demo video: https://youtu.be/RO0luOvpiOY

## Setup
### Prerequisite
Set up at PostgreSQL server. We recommend using [Docker](https://www.docker.com/) with the official PostgreSQL [image](https://hub.docker.com/_/postgres/).

```sh
yarn
yarn build

# OR

npm install
npm run build
```

## Test
### Prerequisite
Set the following environment variables to your PostgreSQL server's credential
  - `PGDB`: Database
  - `PGUSER`: User name
  - `PGPASSWORD`: Password
  - `PGHOST`: Host name
  - `PGPORT`: Port

```sh
yarn test

# OR

npm test
```

## Usage
```js
import * as aq from 'arquero';
import * as fs from 'fs';
import {db} from 'arquero-sql';

// Connect to a database
const pg = new db.Postgres({
  name,
  password,
  host,
  database,
  port
});

// Create a data table
const dt1 = pg.fromArquero(aq.table(...));
// OR
const dt1 = pg.fromCSV(fs.readFileSync('path-to-file.csv'));

// Transform the data table
const dt2 = dt1
  .filter(d => d.Seattle > 200)
  .derive({new_col: d => d.Seattle + 10});

// Observe the transformation result
const output = await dt2.objects();
// OR
dt2.print();
```