import mysql from 'mysql'

export const handler = async (event) => {

  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  // Find reservation
  let findReservation = (email, confirmationCode) => {
    return new Promise((resolve, reject) => {
      const query = `
          SELECT 
            rv.rsvId AS rsvId,
            rs.name AS resName,
            rv.tableNum AS tableNum,
            DATE_FORMAT(rv.reservedTime, '%Y-%m-%d %H:%i') AS reservedTime,
            rv.numGuests AS numGuests
          FROM 
            Reservation rv
          JOIN 
            Restaurant rs ON rv.resId = rs.resId
          WHERE 
            rv.email = ?
            AND rv.confirmationCode = ?;
      `;

      pool.query(query, [email, confirmationCode], (error, rows) => {
        if (error) {
          return reject(error);
        }
        if (rows.length === 0) {
          return resolve(null); // No match found
        }
        // Return the first reservation since there should only be one match
        return resolve(rows[0]);
      });
    });
  };

  // Extract the necessary fields from the event
  const { email, confirmationCode } = event;

  try {
    const reservation = await findReservation(email, confirmationCode);

    if (!reservation) {
      // If no reservation found
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Reservation not found" }),
      };
    }

    // Return the reservation details
    return {
      statusCode: 200,
      body: JSON.stringify({
        rsvId: reservation.rsvId,
        resName: reservation.resName,
        tableNum: reservation.tableNum,
        numGuests: reservation.numGuests,
        reservedTime: reservation.reservedTime,
      }),
    };
  } catch (error) {
    // Handle other errors
    console.error("Error processing reservation:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  } finally {
    // Close DB connections
    pool.end();
  }


};