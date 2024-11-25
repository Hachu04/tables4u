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
  const { token, name, address, openingHour, closingHour } = event;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required authentication: token'
      }),
    };
  }

  if (!name || !address) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: name or address'
      }),
    };
  }

  if (!openingHour || !closingHour) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: opening or closing time',
      }),
    };
  }

  if ((parseInt(closingHour) != 0 && parseInt(closingHour) <= parseInt(openingHour)) || parseInt(closingHour) == parseInt(openingHour)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Closing hour must be after opening hour',
      }),
    };
  }

  if (openingHour < 0 || openingHour > 23 || closingHour < 0 || closingHour > 23) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Opening and closing hour must be 0-23',
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

  // Function to update restaurant info
  let UpdateInfo = (name, address, openingHour, closingHour, resId) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `UPDATE Restaurant
        SET name = ?, address = ?, openingHour = ?, closingHour = ?
        WHERE resId = ?`,
        [name, address, openingHour, closingHour, resId],
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

  // Insert the new restaurant and manager into the database
  let response;
  try {
    // const resData = await GetResInfo(email);
    const resId = await GetResId(email);
    await UpdateInfo(name, address, openingHour, closingHour, resId);

    // Return success response with restaurant data
    response = {
      statusCode: 200,
      body: JSON.stringify({
        name: name,
        address: address,
        openingHour: openingHour,
        closingHour: closingHour,
        success: "true"
      }),
    };

  } catch (error) {
    console.error('Error editing restaurant data:', error);

    response = {
      statusCode: 400,
      body: JSON.stringify({
        error: 'An error occurred while editing restaurant information',
        details: error.message,
      }),
    };
  }

  // Close the DB connections
  pool.end();

  return response;
};
