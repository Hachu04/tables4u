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

  try {
    const { email, role } = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!email || role !== 'Admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Not authorized" }),
      };
    }

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
          `SELECT Reservation.resId, Reservation.tableNum, Reservation.reservedTime
           FROM Reservation
           WHERE DATE(Reservation.reservedTime) BETWEEN ? AND ?`,
          [startDate, endDate],
          (error, results) => {
            if (error) return reject(error);
            resolve(results);
          }
        );
      });
    };

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

              let totalCapacity = 0;
              let totalReservedSeats = 0;

              tables.forEach((table) => {
                totalCapacity += table.numSeats;

                const matchingReservations = reservations.filter(
                  (res) =>
                    res.resId === restaurant.resId &&
                    res.tableNum === table.tableNum
                );

                totalReservedSeats += matchingReservations.length * table.numSeats;
              });

              // Calculate utilization and availability
              const utilization =
                totalCapacity > 0
                  ? ((totalReservedSeats / totalCapacity) * 100).toFixed(2)
                  : "0.00";

              const availability =
                totalCapacity > 0
                  ? (((totalCapacity - totalReservedSeats) / totalCapacity) * 100).toFixed(2)
                  : "0.00";

              resolve({
                name: restaurant.name,
                utilization: `${utilization}%`,
                availability: `${availability}%`,
              });
            }
          );
        });
      })
    );

    pool.end();
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