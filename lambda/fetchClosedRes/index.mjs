import mysql from 'mysql';

export const handler = async (event) => {
  // Get credentials from the database access layer
  const pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  });

  const fetchClosedRes = (day) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT resId FROM ClosedDays WHERE day = ?;`,
        [day],
        (error, rows) => {
          if (error) {
            return reject(error);
          }
          resolve(rows);
        }
      );
    });
  };

  // Extract the date from the event
  const day = event.day;

  if (!day) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing 'day' parameter in the request."
      })
    };
  }

  try {
    // Fetch closed restaurant IDs
    const closedRes = await fetchClosedRes(day);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: closedRes
      })
    };

  } catch (error) {
    console.error("Error fetching closed restaurants:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Internal server error. Failed to fetch closed restaurants."
      })
    };
  } finally {
    // Close DB connections
    pool.end
  }
};
