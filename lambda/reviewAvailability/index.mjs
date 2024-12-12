import mysql from 'mysql'
import jwt from 'jsonwebtoken'

export const handler = async (event) => {
  // get credentials from the db_access layer
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  // Helper function to query database
  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  };

  // Get restaurant ID from manager's email
  const getManagerRestaurantId = async (email) => {
    const results = await queryDatabase(
      'SELECT ownedResID FROM RestaurantManager WHERE email = ?',
      [email]
    );
    if (results.length === 0) {
      throw new Error("No restaurant found for this manager");
    }
    return results[0].ownedResID;
  };

  // Get restaurant details
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

  // Get all tables for restaurant
  const getTables = async (resId) => {
    const results = await queryDatabase(
      'SELECT tableNum, numSeats FROM ResTable WHERE resId = ?',
      [resId]
    );
    return results;
  };

  // Get reservations for specific date
  const getReservations = async (resId, date) => {
    const query = `
      SELECT 
        tableNum,
        HOUR(reservedTime) as hour,
        email
      FROM Reservation 
      WHERE resId = ? 
        AND DATE(reservedTime) = ?
    `;

    const results = await queryDatabase(query, [resId, date]);
    return results;
  };

  // Check if restaurant is closed
  const isRestaurantClosed = async (resId, date) => {
    const results = await queryDatabase(
      'SELECT 1 FROM ClosedDays WHERE resId = ? AND day = ?',
      [resId, date]
    );
    return results.length > 0;
  };

  try {
    // Validate token
    if (!event.token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing token' })
      };
    }

    // Verify JWT
    const decoded = jwt.verify(event.token, process.env.JWT_SECRET_KEY);
    if (!decoded.email || decoded.role !== 'RestaurantManager') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get restaurant ID and validate manager
    const resId = await getManagerRestaurantId(decoded.email);

    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];

    // Check if restaurant is closed
    const closed = await isRestaurantClosed(resId, currentDate);
    if (closed) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Restaurant is closed today' })
      };
    }

    // Get restaurant details
    const restaurant = await getRestaurant(resId);
    if (!restaurant.isActive) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Restaurant is not active' })
      };
    }

    // Get all tables
    const tables = await getTables(resId);

    // Get reservations for today
    const reservations = await getReservations(resId, currentDate);

    // Create a map of reserved tables by hour
    const reservedTablesByHour = {};
    reservations.forEach(reservation => {
      if (!reservedTablesByHour[reservation.hour]) {
        reservedTablesByHour[reservation.hour] = new Map();
      }
      reservedTablesByHour[reservation.hour].set(reservation.tableNum, reservation.email);
    });

    // Generate available time slots
    const timeSlots = [];
    for (let hour = restaurant.openingHour; hour < restaurant.closingHour; hour++) {
      const availableTables = tables.map(table => {
        const reservedEmail = reservedTablesByHour[hour]?.get(table.tableNum);
        return {
          tableNum: table.tableNum,
          numSeats: table.numSeats,
          reservedEmail: reservedEmail || null
        };
      });

      timeSlots.push({
        hour,
        availableTables
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        date: currentDate,
        timeSlots
      })
    };

  } catch (error) {
    console.error('Error:', error);

    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token expired' })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Internal server error' })
    };

  } finally {
    pool.end();
  }
};
