/*
Example:
columns=[A, B, C, D]
fold([A, B])

SELECT C, D, key, (
    CASE
        WHEN __aq__fold__keys__.key = 'A' THEN A
        WHEN __aq__fold__keys__.key = 'B' THEN B
    END
) as value
FROM table
JOIN (SELECT unnest(ARRAY['A', 'B']) key) as __aq__fold__keys__;
*/
