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

  //CHECK FOR DUPLICATE ENTRY
  let OpenRestaurant = (resId, date) => {
    return new Promise((resolve, reject) => {
      pool.query(
        "DELETE FROM ClosedDays WHERE resId=? AND day=?;",
        [resId, date],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          if ((rows) && (rows.affectedRows == 1)) {
            return resolve(true);
          } else {
            return resolve(false);
          }
        }
      );
    });
  };

  // Extract the necessary fields from the event
  const { token, date } = event;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required authentication: token'
      }),
    };
  }

  if (!date) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: date'
      }),
    };
  }

  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Date not in format: YYYY-MM-DD'
      }),
    };
  }

  const inputDate = new Date(date);
  const curDate = new Date();

  const tomorrow = new Date(Date.UTC(curDate.getUTCFullYear(), curDate.getUTCMonth(), curDate.getUTCDate() + 1));
  const closeDateUTC = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));

  if (closeDateUTC < tomorrow) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Closing day must be in the future'
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

  // Insert the new closed day into the database
  let response;
  try {
    // Fetch closed day data based on manager's email
    const resId = await GetResId(email);
    const result = await OpenRestaurant(resId, date);

    if (result) {
      response = {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Restaurant has been opened on ' + date
        })
      }
    } else {
      response = {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Restaurant is already opened on ' + date
        })
      }
    }

  } catch (error) {
    response = {
      statusCode: 400,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }

  // Close the DB connections
  pool.end();

  return response;
};
