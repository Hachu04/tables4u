import mysql from 'mysql';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
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

  try {
    // Use the promise-based approach to verify the JWT
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
          reject(err); // Reject the promise with the error
        } else {
          resolve(decoded); // Resolve the promise with the decoded token
        }
      });
    });

    // If token is valid, return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        decoded
      }),
    };

  } catch (err) {
    // Handle different error types
    if (err instanceof jwt.JsonWebTokenError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid token: " + err.message
        }),
      };
    } else if (err instanceof jwt.TokenExpiredError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Token has expired: " + err.message
        }),
      };
    } else if (err instanceof jwt.NotBeforeError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Token is not active yet: " + err.message
        }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Error verifying token: " + err.message
        }),
      };
    }
  }
};
