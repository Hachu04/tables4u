import mysql from 'mysql';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  const pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager",
  });

  const { startDate, endDate, token } = event;

  // Validate input
  if (!startDate || !endDate || !token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields: startDate, endDate, or token",
      }),
    };
  }

  if (new Date(startDate) > new Date(endDate)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "startDate and endDate are incorrectly formatted or reversed",
      }),
    };
  }

  
    // Verify the token
    const { email, role } = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!email || !role) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Not authorized" }),
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

    // Fetch data from the database
    const getRestaurants = () => {
      return new Promise((resolve, reject) => {
        pool.query(
          "SELECT resId, name FROM Restaurant WHERE isActive = 1",
          (error, results) => {
            if (error) return reject(error);
            resolve(results);
          }
        );
      });
    };

    const getReservations = () => {
      return new Promise((resolve, reject) => {
        pool.query(
          `SELECT Reservation.resId, Reservation.tableNum, ResTable.numSeats, Reservation.reservedTime
           FROM Reservation
           JOIN ResTable ON Reservation.tableNum = ResTable.tableNum
           WHERE DATE(Reservation.reservedTime) BETWEEN ? AND ?`,
          [startDate, endDate],
          (error, results) => {
            if (error) return reject(error);
            resolve(results);
          }
        );
      });
    };

    try {

    const restaurants = await getRestaurants();
    const reservations = await getReservations();

    const report = await Promise.all(
      restaurants.map(async (restaurant) => {
        return new Promise((resolve, reject) => {
          pool.query(
            "SELECT tableNum, numSeats FROM ResTable WHERE resId = ?",
            [restaurant.resId],
            (error, tables) => {
              if (error) return reject(error);

              const reservedData = tables.map((table) => {
                const matchingReservations = reservations.filter(
                  (res) =>
                    res.resId === restaurant.resId &&
                    res.tableNum === table.tableNum
                );

                const totalReservedSeats = matchingReservations.reduce(
                  (sum, res) => sum + table.numSeats,
                  0
                );

                return {
                  tableNum: table.tableNum,
                  totalReservedSeats,
                  availableSeats: table.numSeats - totalReservedSeats,
                };
              });

              const totalCapacity = tables.reduce(
                (sum, table) => sum + table.numSeats,
                0
              );
              const totalReserved = reservedData.reduce(
                (sum, data) => sum + data.totalReservedSeats,
                0
              );

              const utilization =
                totalCapacity > 0
                  ? ((totalReserved / totalCapacity) * 100).toFixed(2) + "%"
                  : "0%";
              const availability =
                totalCapacity > 0
                  ? (((totalCapacity - totalReserved) / totalCapacity) * 100).toFixed(2) + "%"
                  : "0%";

              resolve({
                name: restaurant.name,
                utilization,
                availability,
              });
            }
          );
        });
      })
    );

    pool.end(); // Ensure the pool is closed
    return {
      statusCode: 200,
      body: JSON.stringify({ "active-restaurants": report }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
