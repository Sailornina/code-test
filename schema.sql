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