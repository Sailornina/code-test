import { faker } from '@faker-js/faker';
import pgPromise from 'pg-promise';

const BATCH_SIZE = 100;

const options = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PWD,
  port: process.env.POSTGRES_PORT,
  allowExitOnIdle: true
}

const pgp = pgPromise()
const db = pgp(options)

function slicedArray(array, sliceSize) {
  return array.reduce((acc, current, index) => {
    const sliceIndex = Math.floor(index / sliceSize);
    if (!acc[sliceIndex]) {
      acc[sliceIndex] = [current];
    } else {
      acc[sliceIndex].push(current);
    } 
    return acc;
  }, []);
};

//Persons.
const generateRandomPerson = () => ({
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
});

const personColumnSet = new pgp.helpers.ColumnSet([
  {name: "first_name"},
  {name: "last_name"}
], {table: "persons"});

const persons = Array.from({ length: 10000 }, generateRandomPerson);

const personsInsertResults = slicedArray(persons, BATCH_SIZE).map((batchToInsert) => {
  return db.none(pgp.helpers.insert(batchToInsert, personColumnSet));
});

//Companies
const generateRandomCompany = () => ({
  company_name: faker.company.name(),
});

const companyColumnSet = new pgp.helpers.ColumnSet([
  {name: "company_name"}
], {table: "companies"});

const companies = Array.from({ length: 5000 }, generateRandomCompany);

const companiesInsertResults = slicedArray(companies, BATCH_SIZE).map((batchToInsert) => {
  return db.none(pgp.helpers.insert(batchToInsert, companyColumnSet));
});

await Promise.all([personsInsertResults, companiesInsertResults].flat());

console.log("Companies and Persons are Done!")

// // Creating jobs for EACH person with random companies.
const personIds = (await db.any("SELECT id FROM persons")).map((result) => parseInt(result["id"]));
const companyIds = (await db.any("SELECT id FROM companies")).map((result) => parseInt(result["id"]));  

const jobColumnSet = new pgp.helpers.ColumnSet([
  {name: "person_id"},
  {name: "company_id"},
  {name: "start_date"},
  {name: "end_date"},
], {table: "jobs"});

let allJobs = personIds.flatMap((personId) => {
  const numberOfJobs = Math.floor(Math.random() * 3) + 1;
  var currentDate = new Date();

  let jobs = []

  for (let i = 0; i < numberOfJobs; i++) {
    const companyId = companyIds[Math.floor(Math.random()*companyIds.length)];
    const end_date = i == 0 ? null : faker.date.past({ years: 1, refDate: currentDate});
    const start_date = i == 0 ? faker.date.past({years: 3}) : faker.date.past({years: 2, refDate: end_date});

    currentDate = start_date;

    jobs.push({
      person_id: personId,
      company_id: companyId,
      start_date,
      end_date
    })
  }
  return jobs; 
});

const jobsInsertResults = slicedArray(allJobs, BATCH_SIZE).map((batchToInsert) => {
  return db.none(pgp.helpers.insert(batchToInsert, jobColumnSet));
});

await Promise.all(jobsInsertResults);

db.$pool.end();
console.log("All jobs created");
