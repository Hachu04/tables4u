import mysql from 'mysql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = crypto.randomBytes(64).toString('hex');

export const handler = async (event) => {
  // Set up the database connection pool
  const pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  });

  // Function to validate login credentials
  const ValidateLogin = (email) => {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT email, password FROM RestaurantManager WHERE email = ?", 
        [email], 
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          return resolve(rows.length > 0 ? rows[0] : null);
        }
      );
    });
  };

  // Extract fields from the event
  const { email, password } = event;

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: email or password'
      }),
    };
  }

  const isWhitespace = (str) => !str.replace(/\s/g, '').length;
  if (isWhitespace(email) || isWhitespace(password)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'These fields contain only whitespace: email or password'
      }),
    };
  }

  try {
    // Validate login credentials
    const manager = await ValidateLogin(email);
    if (!manager) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid email or password'
        })
      };
    }

    // Compare input password with hashed password from the database
    const isMatch = await bcrypt.compare(password, manager.password);
    if (!isMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid email or password'
        }),
      };
    }

    // Generate JWT token with expiration
    const token = jwt.sign(
      { email: manager.email, role: 'RestaurantManager' }, // Payload
      SECRET_KEY,
      { expiresIn: '2h' } // Token expiration time
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
        token: token
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Internal server error: ' + error.message,
      }),
    };
  } finally {
    // Release connections
    pool.end();
  }
};
