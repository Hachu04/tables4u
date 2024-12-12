import mysql from 'mysql'

export const handler = async (event) => {

  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  // List ONLY ACTIVE restaurants from database
  let listActiveRestaurants = () => {

    return new Promise((resolve, reject) => {

      pool.query("SELECT resId, name, address, isActive, openingHour, closingHour FROM Restaurant WHERE isActive = 1;", [], (error, rows) => {

        if (error) {
          return reject(error);
        }
        return resolve(rows);

      })

    })

  }

  try {

    // All info from listRestaurants
    const all_restaurant = await listActiveRestaurants()

    return {
      statusCode: 200,
      restaurant: all_restaurant
    }

  } catch (error) {

    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Something went wrong'
      }),
    };

  } finally {
    // close DB connections
    pool.end()
  }

};