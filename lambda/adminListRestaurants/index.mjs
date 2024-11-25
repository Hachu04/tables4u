import mysql from 'mysql'

export const handler = async (event) => {

  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  let listRestaurants = () => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT name, isActive FROM Restaurant", [], (error, rows) => {
            if (error) { return reject(error); }
            return resolve(rows);
        })
    })
}

const all_restaurant = await listRestaurants()

const response = {
  statusCode: 200,
  restaurant: all_restaurant
}

pool.end()     // close DB connections

return response;

};