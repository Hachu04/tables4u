import mysql from 'mysql';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  // Set up the MySQL connection pool
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager",
  });

  // Extract token and restaurant name from the event
  const { name, token } = event;

  if (!token || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields: token or name",
      }),
    };
  }

  // Verify the token
  const { email, role } = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (!email || !role) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid token payload'
      }),
    };
  }

  if (role !== 'Admin') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Incorrect role'
      }),
    };
  }

  // Delete restaurant from the database
  let deleteRestaurant = () => {
    return new Promise((resolve, reject) => {
      pool.query(
        "DELETE FROM Restaurant WHERE name = ?",
        [name],
        (error, result) => {
          if (error) return reject(error);
          if (result.affectedRows === 0) {
            return reject(new Error("Restaurant does not exist"));
          }
          resolve(true);
        }
      );
    });
  };

  try {
    await deleteRestaurant();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: "true",
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: error.message || "Something went wrong",
      }),
    };
  } finally {
    // Close the database connection
    pool.end();
  }
};
