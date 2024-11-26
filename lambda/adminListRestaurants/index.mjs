import mysql from 'mysql'
import jwt from 'jsonwebtoken';

export const handler = async (event) => {

  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
    host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "chuvietha11204",
    database: "res_manager"
  })

  // Extract the necessary fields from the event
  const { token } = event;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required authentication: token'
      }),
    };
  }
  const { email, role } = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (!email || !role) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid token payload'
      }),
    };
  }

  // Checks if person has the Admin role
  if (role !== 'Admin') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Incorrect role'
      }),
    };
  }


  // List restaurant name and active status from database
  let listRestaurants = () => {

    return new Promise((resolve, reject) => {

        pool.query("SELECT resId, name, isActive FROM Restaurant", [], (error, rows) => {
            if (error) { 
              return reject(error); 
            }
            return resolve(rows);
        })

    })

  }

  try {

    // All info from listRestaurants
   const all_restaurant = await listRestaurants()

   return{
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

  return response;

};