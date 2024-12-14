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

  // Function to get resId
  let GetResId = (email) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT Restaurant.resId
         FROM Restaurant
         JOIN RestaurantManager ON Restaurant.resId = RestaurantManager.ownedResId
         WHERE RestaurantManager.email = ?;`,
        [email],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          if (rows.length === 0) {
            return reject(new Error('Restaurant not found.'));
          }
          return resolve(rows[0].resId);
        }
      );
    });
  };

  // Function to check if the restaurant has at least one table
  let CheckTablesExist = (resId) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT COUNT(*) as tableCount FROM ResTable WHERE resId = ?;`,
        [resId],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          if (rows[0].tableCount === 0) {
            return reject(new Error('No tables found for the restaurant. Please add at least one table before activating'));
          }
          return resolve();
        }
      );
    });
  };

  // Function to activate restaurant
  let Activate = (resId) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `UPDATE Restaurant
        SET isActive = 1
        WHERE resId = ?`,
        [resId],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          if (rows.length === 0) {
            return reject(new Error('Restaurant not found.'));
          }
          return resolve(rows);
        }
      );
    });
  };

  // Update database
  let response;
  try {
    const resId = await GetResId(email);
    await CheckTablesExist(resId);
    await Activate(resId);

    // Return success response
    response = {
      statusCode: 200,
      body: JSON.stringify({
        success: "true"
      }),
    };

  } catch (error) {
    console.error('Error activating restaurant data:', error);

    response = {
      statusCode: 400,
      body: JSON.stringify({
        error: error.message
      }),
    };
  }

  // Close the DB connections
  pool.end();

  return response;
};
