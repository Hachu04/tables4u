import mysql from 'mysql';

export const handler = async (event) => {

  // Set up the MySQL connection pool
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager",
  });

  // Extract token and reservation from the event
  const { rsvId } = event;

  if (!rsvId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing reservation id",
      }),
    };
  }

  // Delete reservation from the database
  let DeleteReservation = () => {
    return new Promise((resolve, reject) => {
      pool.query(
        "DELETE FROM Reservation WHERE rsvId = ?",
        [rsvId],
        (error, result) => {
          if (error) return reject(error);
          if (result.affectedRows === 0) {
            return reject(new Error("Reservation does not exist"));
          }
          resolve(true);
        }
      );
    });
  };

  try {
    await DeleteReservation();

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
