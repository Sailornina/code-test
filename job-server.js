import pg from 'pg';
import { faker } from '@faker-js/faker';
const { Client } = pg

const username = process.env

const options = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PWD,
  port: process.env.POSTGRES_PORT,
}

const client = new Client(options)
await client.connect()

//Persons.
const generateRandomPerson = () => ({
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
});

const persons = await Promise.all(Array.from({ length: 10000 }, generateRandomPerson).map(async(person) => {
  let result = await client.query("INSERT INTO persons(first_name, last_name) VALUES ($1, $2) RETURNING id", [person.first_name, person.last_name])
  // console.log("Inserted person: " + JSON.stringify(person))
  return {id: parseInt(result.rows[0].id), ...person}
}));

//Companies.
const generateRandomCompany = () => ({
  company_name: faker.company.name(),
});

const companies = await Promise.all(Array.from({ length: 5000 }, generateRandomCompany).map(async(company) => {
  let result = await client.query("INSERT INTO companies(company_name) VALUES ($1) RETURNING id", [company.company_name])
  // console.log("Inserted company: " + JSON.stringify(company))
  return {id: parseInt(result.rows[0].id), ...company}
}));

// Creating jobs for EACH person with random companies.
const jobs = [];
let jobs_results = await persons.flatMap(async (person) => {

  const numberOfJobs = Math.floor(Math.random() * 3) + 1;

  var currentDate = new Date();

  let job_results = []

  for (let i = 0; i < numberOfJobs; i++) {
    const company = companies[Math.floor(Math.random()*companies.length)];

    const end_date = i == 0 ? null : faker.date.past({ years: 1, refDate: currentDate})
    const start_date = i == 0 ? faker.date.past({years: 3}) : faker.date.past({years: 2, refDate: end_date})

    currentDate = start_date;
    const values = [person.id, company.id, start_date, end_date]
    // console.log("Inserting job: " + values)
    let job_result = await client.query("INSERT INTO jobs(person_id, company_id, start_date, end_date) VALUES ($1, $2, $3, $4)", values)
    job_results.push(job_result)
  }

  return jobs_results; 
});


//All Job Data.
const getJobData = async () => {
  try {
    const res = await client.query('SELECT p.id, p.first_name, p.last_name, c.company_name, j.start_date, j.end_date FROM jobs AS j LEFT JOIN companies AS c ON c.id = j.company_id LEFT JOIN persons AS p ON p.id = j.person_id GROUP BY p.id, c.id, j.id')
    return res.rows
  } catch (err) {
      console.error("Something went wrong with the query")
      return [];
  }
};

await Promise.all(jobs_results)
const result = await getJobData();
// console.log(result);
client.end();