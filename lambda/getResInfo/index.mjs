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

  // Function to create a new restaurant
  let GetResInfo = (email) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT Restaurant.*
         FROM Restaurant
         JOIN RestaurantManager ON Restaurant.name = RestaurantManager.ownedRestaurant
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

  const { email, role } = jwt.verify(authToken, process.env.JWT_SECRET_KEY);

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

  // Insert the new restaurant and manager into the database
  let response;
  try {
    // Create the restaurant
    resData = await GetResInfo(email);

    // Return success response
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Restaurant and Restaurant Manager created successfully',
        restaurant: {
          name: name,
          address: address
        },
        manager: {
          email: email
        }
      }),
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response = {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Restaurant already exists',
        }),
      }
    } else {
      response = {
        statusCode: 400,
        body: JSON.stringify({
          error: error.message,
        }),
      };
    }


  }

  // Close the DB connections
  pool.end();

  return response;
};
