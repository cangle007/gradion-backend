const environment = process.env.NODE_ENV || 'development';

if (environment !== 'production') {
  require('dotenv').config({
    path: `.env.${environment}`,
  });
}

module.exports = {
  NODE_ENV: environment,
  DATABASE_URL: process.env.DATABASE_URL,
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
  PGHOST: process.env.PGHOST,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGDATABASE: process.env.PGDATABASE,
  JWT_KEY: process.env.JWT_KEY,
  DEBUG: parseInt(process.env.DEBUG || '0', 10),
};
