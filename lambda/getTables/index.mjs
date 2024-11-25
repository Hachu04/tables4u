import mysql from 'mysql';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  // Get credentials from the DB access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  });

  // Function to get list of table
  let GetTables = (email) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT ResTable.tableNum, ResTable.numSeats
         FROM ResTable
         JOIN Restaurant ON ResTable.resId = Restaurant.resId
         JOIN RestaurantManager ON Restaurant.resId = RestaurantManager.ownedResId
         WHERE RestaurantManager.email = ?;`,
        [email],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          return resolve(rows);
        }
      );
    });
  };

  // Extract the necessary fields from the event
  const { token } = event;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required authentication: token'
      }),
    };
  }

  const { email, role } = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (!email || !role) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid token payload'
      }),
    };
  }

  if (role !== 'RestaurantManager') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Incorrect role'
      }),
    };
  }

  let response;
  try {
    // Fetch the list of tables based on the manager's email
    const tablesList = await GetTables(email);

    if (!tablesList || tablesList.length === 0) {
      // No tables found for the manager's restaurant
      response = {
        statusCode: 400,
        body: JSON.stringify({
          error: 'No tables found for the restaurant managed by the provided email.',
        }),
      };
    } else {
      // Return the list of tables
      response = {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          tables: tablesList,
        }),
      };
    }
  } catch (error) {
    console.error('Error fetching table data:', error);

    // Handle unexpected errors
    response = {
      statusCode: 400,
      body: JSON.stringify({
        error: 'An error occurred while retrieving table information.',
        details: error.message,
      }),
    };
  }

  // Close the DB connections
  pool.end();

  return response;
};
