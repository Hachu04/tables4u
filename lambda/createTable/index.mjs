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

  let CreateTable = (tableNum, numSeats, resId) => {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO ResTable (tableNum, numSeats, resId) VALUES (?, ?, ?);",
        [tableNum, numSeats, resId],
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
  const { token, tableNum, numSeats } = event;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required authentication: token'
      }),
    };
  }

  if (!tableNum || !numSeats) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: tableNum, numSeats'
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

  // Insert the new restaurant and manager into the database
  let response;
  try {
    // Fetch restaurant data based on manager's email
    const resId = await GetResId(email);

    const table = await CreateTable(tableNum, numSeats, resId);
  
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Table created successfully',
        table: {
          tableNum: tableNum,
          numSeats: numSeats,
          resId: resId
        }
      }),
    }
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
  
    if (error.code === 'ER_DUP_ENTRY') {
      response = {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Table already exists',
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
