/*
Example:
columns=[A, B, C, D]

1. PIVOT(A, B)

find all possible keys: X, Y

SELECT first(B) FILTER (WHERE A = 'X') as X, first(B) FILTER (WHERE A = 'Y') as Y
FROM Table


2. GROUPBY(C) -> PIVOT(A, SUM(B))

find all possible keys: X, Y

SELECT C, SUM(B) FILTER (WHERE A = 'X') as X, SUM(B) FILTER (WHERE A = 'Y') as Y
FROM Table
GROUPBY C
*/
