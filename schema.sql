CREATE TABLE persons (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE companies (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    company_name VARCHAR(70) NOT NULL 
); 

CREATE TABLE jobs (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    person_id BIGINT REFERENCES persons (id),
    company_id BIGINT REFERENCES companies (id),
    start_date DATE,
    end_date DATE
);

/*Common name */
SELECT first_name, COUNT(*) AS common_name FROM persons GROUP BY first_name ORDER BY common_name DESC LIMIT 1;

/*Company with the most employees*/ 
SELECT c.company_name, COUNT(*) AS employee_number
FROM companies c
JOIN jobs j ON c.id = j.company_id
GROUP BY c.company_name
ORDER BY employee_number DESC
LIMIT 1;

/*Person with the longest years of work experience*/
SELECT p.id, p.first_name, p.last_name, SUM(AGE(COALESCE(j.end_date, NOW()), j.start_date)) AS total_worked FROM jobs AS j
JOIN persons AS p ON p.id = j.person_id
GROUP BY p.id, p.first_name, p.last_name
ORDER BY total_worked DESC
LIMIT 1;


/*Person with the shortest years of work experience*/
SELECT p.id, p.first_name, p.last_name, SUM(AGE(COALESCE(j.end_date, NOW()), j.start_date)) AS total_worked FROM jobs AS j
JOIN persons AS p ON p.id = j.person_id
GROUP BY p.id, p.first_name, p.last_name
ORDER BY total_worked ASC
LIMIT 1;

/*Average years of work experiencie*/
WITH total_by_person AS (
    SELECT p.id as person_id, SUM(AGE(COALESCE(j.end_date, NOW()), j.start_date)) AS avg_worked FROM jobs AS j
    JOIN persons AS p ON p.id = j.person_id
    GROUP BY p.id
)
SELECT AVG(avg_worked) FROM total_by_person;

/*Cleanup*/
DELETE FROM jobs;
DELETE FROM persons;
DELETE FROM companies;