import mysql from 'mysql'

export const handler = async (event) => {

  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  // Make reservation
  let makeReservation = (email, name, resId, tableNum, numGuests, reservedTime, confirmationCode) => {

    return new Promise((resolve, reject) => {
      const query = `
            INSERT INTO Reservation (email, name, resId, tableNum, numGuests, reservedTime, confirmationCode) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

      pool.query(query, [email, name, resId, tableNum, numGuests, reservedTime, confirmationCode], (error, rows) => {
        if (error) {
          return reject(error);
        }
        return resolve(rows);
      });

    });

  }

  let getResName = (resId) => {

    return new Promise((resolve, reject) => {
      const query = `
            SELECT name FROM Restaurant WHERE resId = '?';
        `;

      pool.query(query, [resId], (error, rows) => {
        if (error) {
          return reject(error);
        }
        if (rows.length === 0) {
          return reject(new Error("No restaurant found with the provided resId"));
        }
        return resolve(rows[0].name);
      });

    });

  }

  let getNumSeats = (tableNum, resId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT numSeats FROM ResTable WHERE tableNum = ? AND resId = ?;
        `;
  
      // Execute the query
      pool.query(query, [tableNum, resId], (error, rows) => {
        if (error) {
          return reject(new Error(`Database query failed: ${error.message}`));
        }
        if (rows.length === 0) {
          return reject(new Error(`Table not found for tableNum: ${tableNum}, resId: ${resId}`));
        }
        return resolve(rows[0].numSeats);
      });
    });
  };
  

  let generateConfirmationCode = () => {
    const characters = '0123456789';
    let confirmationCode = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      confirmationCode += characters[randomIndex];
    }
    return confirmationCode;
  }

  let validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  let validateReservedTime = (reservedTime) => {
    const now = new Date(); // Current date and time
    const reservationDate = new Date(reservedTime);
  
    if (isNaN(reservationDate.getTime())) {
      return false;
    }
  
    if (reservationDate <= now) {
      return false;
    }

    return true;
  };
  

  // Extract the necessary fields from the event
  const { email, name, resId, tableNum, numGuests, reservedTime } = event;

  if (!validateEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid email'
      }),
    };
  }

  if (numGuests < 1 || numGuests > 8) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'numGuests must be 1-8'
      }),
    };
  }

  if (!validateReservedTime(reservedTime)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Reserved time must be in the future'
      }),
    };
  }

  try {

    const confirmationCode = generateConfirmationCode();

    const resName = await getResName(resId);

    const numSeats = await getNumSeats(tableNum, resId);

    if (numGuests > numSeats) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Number of Guests is larger then Number of Seats'
        }),
      };
    }

    await makeReservation(email, name, resId, tableNum, numGuests, reservedTime, confirmationCode);

    return {
      statusCode: 200,
      body: JSON.stringify({
        email,
        name,
        resName,
        tableNum,
        numGuests,
        reservedTime,
        confirmationCode
      }),
    }

  } catch (error) {

    if (error.code === "ER_DUP_ENTRY") {
      // Duplicate entry error indicates the time slot is already booked
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Time already booked" }),
      };
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      // Table not found
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Table not found" }),
      };
    }

    // Handle other errors
    console.error("Error processing reservation:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Internal server error" }),
    };

  } finally {
    // close DB connections
    pool.end()
  }

};