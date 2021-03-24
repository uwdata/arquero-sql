# Arquero-SQL
SQL backend support for [Arquero](https://github.com/uwdata/arquero).
Arquero-SQL can generate an SQL code that imitate an Arquero query and execute it in a SQL backend.

## Setup
```sh
yarn
yarn build
```

## Test
```sh
# install and start local postgresql server
yarn test
```

## Example
```js
base
  .filter(d => d.Seattle > 200)
  .derive({new_col: d => d.Seattle + 10})
  .toSql()
/*
result:
SELECT a,b,c,d,new_col
FROM (
  SELECT a,b,c,d,(Seattle+10) AS new_col
  FROM (
    SELECT a,b,c,d
    FROM (
      SELECT a,b,c,d
      FROM base AS table3
    ) AS table2
    WHERE (Seattle>200)
  ) AS table1
) AS table0
*/
```
