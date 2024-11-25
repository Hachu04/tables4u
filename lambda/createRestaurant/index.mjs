import mysql from 'mysql';
import bcrypt from 'bcryptjs';

export const handler = async (event) => {
  // Get credentials from the DB access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  });

  // Function to create a new restaurant
  let CreateRestaurant = (name, address) => {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO Restaurant (name, address) VALUES (?, ?);",
        [name, address],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          return resolve(rows);
        }
      );
    });
  };

  let GetResId = (address) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT resId FROM Restaurant WHERE address = ?;`,
        [address],
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

  // Function to create a new restaurant manager
  let CreateRestaurantManager = (email, password, resId) => {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO RestaurantManager (email, password, ownedResId) VALUES (?, ?, ?);",
        [email, password, resId],
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
  const { name, address, email, password } = event;

  if (!name || !address || !email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: name, address, email, or password'
      }),
    };
  }

  const isWhitespace = str => !str.replace(/\s/g, '').length

  if (isWhitespace(name) || isWhitespace(address) || isWhitespace(email) || isWhitespace(password)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'These fields contain only whitespace: name, address, email, or password'
      }),
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the new restaurant and manager into the database
  let response;
  try {
    // Create the restaurant
    await CreateRestaurant(name, address);

    //Get restaurant Id to input into manager
    const id = await GetResId(address);

    // Create the restaurant manager and link to the restaurant
    await CreateRestaurantManager(email, hashedPassword, id);

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
