import mysql from 'mysql'

export const handler = async (event) => {

  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  // Function to find specific restaurant
  let findSpecific = (name) => {

    return new Promise((resolve, reject) => {

      pool.query(
        `SELECT *
        FROM Restaurant
        WHERE name = ? AND isActive = 1;`,
        [name],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          if (rows.length === 0) {
            return reject(new Error('Restaurant not found.'));
          }
          return resolve(rows[0].name);
        }
      )

    })

  }

  // Update consumer dashboard with searched restaurant
  const {nameToSearch} = event;
  let response;
  try{

    await findSpecific(nameToSearch)

    // Return success response
    response = {
    statusCode: 200,
    body: JSON.stringify('Found Restaurant')
    };

  } catch (error){

    response = {
      statusCode: 400,
      body: JSON.stringify('Error trying to find restaurant : ' + nameToSearch)
    };

  }

  // Close the DB connections
  pool.end();
  return response;

};