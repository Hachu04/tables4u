import mysql from 'mysql';

export const handler = async (event) => {
  // Database connection pool
  const pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  });

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  };

  const getRestaurant = async (resId) => {
    const results = await queryDatabase(
      'SELECT openingHour, closingHour, isActive FROM Restaurant WHERE resId = ?',
      [resId]
    );
    if (results.length === 0) {
      throw new Error("Restaurant not found");
    }
    return results[0];
  };

  const getTables = async (resId) => {
    const results = await queryDatabase(
      'SELECT tableNum, numSeats FROM ResTable WHERE resId = ?',
      [resId]
    );
    return results;
  };

  const getReservations = async (resId, date, time = null) => {
    let query = `
      SELECT tableNum, HOUR(reservedTime) as hour, email
      FROM Reservation 
      WHERE resId = ? AND DATE(reservedTime) = ?
    `;
    const params = [resId, date];

    if (time) {
      query += ` AND HOUR(reservedTime) = ?`;
      params.push(time);
    }

    return await queryDatabase(query, params);
  };

  try {
    const { resId, date, time } = event;

    if (!resId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing resId' }) };
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const selectedDate = date || currentDate;

    const restaurant = await getRestaurant(resId);
    if (!restaurant.isActive) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Restaurant is not active' }) };
    }

    const tables = await getTables(resId);
    const reservations = await getReservations(resId, selectedDate, time ? parseInt(time) : null);

    const reservedTablesByHour = {};
    reservations.forEach((res) => {
      if (!reservedTablesByHour[res.hour]) {
        reservedTablesByHour[res.hour] = new Map();
      }
      reservedTablesByHour[res.hour].set(res.tableNum, res.email);
    });

    const timeSlots = [];
    if (time) {
      // Case 2 and Case 4: Fetch availability for a specific time slot
      const hour = parseInt(time);
      const availableTables = tables.map((table) => {
        const reservedEmail = reservedTablesByHour[hour]?.get(table.tableNum);
        return {
          tableNum: table.tableNum,
          numSeats: table.numSeats,
          reservedEmail: reservedEmail || null,
        };
      });
      timeSlots.push({ hour, availableTables });
    } else {
      // Case 1 and Case 3: Fetch availability for all time slots
      for (let hour = restaurant.openingHour; hour < restaurant.closingHour; hour++) {
        const availableTables = tables.map((table) => {
          const reservedEmail = reservedTablesByHour[hour]?.get(table.tableNum);
          return {
            tableNum: table.tableNum,
            numSeats: table.numSeats,
            reservedEmail: reservedEmail || null,
          };
        });

        timeSlots.push({ hour, availableTables });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        date: selectedDate,
        timeSlots,
      }),
    };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 400, body: JSON.stringify({ error: error.message || 'Internal server error' }) };

  } finally {
    pool.end();
  }
};
