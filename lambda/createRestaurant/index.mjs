import mysql from 'mysql'

export const handler = async (event) => {
  
  // get credentials from the db_access layer (loaded separately via AWS console)
  var pool = mysql.createPool({
      host: "calculatordb.chlxnoru1n0z.us-east-1.rds.amazonaws.com",
      user: "calcAdmin",
      password: "calc:pass",
      database: "calc"
  })
  
  let CountConstants = () => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT COUNT(*) AS `num` FROM Constants;", [], (error, value) => {
            if (error) { return reject(error); }
            // turns into array containing single value [ { num: 13 } ]
            let output = JSON.parse(JSON.stringify(value))
            
            // return first entry and grab its 'num' attribute
            return resolve(output[0].num);
        })
    })
}

  let CreateConstant = (name, value) => {
      return new Promise((resolve, reject) => {
          pool.query("INSERT INTO Constants (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?;", [name, value, value], (error, rows) => {
              if (error) { return reject(error); }
              return resolve(rows);
          })
      })
  }

  const numbers = await CountConstants()
  let response;
  if (numbers > 30) {
     response = {
      statusCode: 400,
      error: "Too many constants defined."
    }
  } else {

      // NOTE: what if fails?
      const all_result = await CreateConstant(event.name, event.value)
      
      response = {
        statusCode: 200,
        result: {
          "name" : event.name,
          "value" : event.value
        }
      }
    }
  
  pool.end()     // close DB connections

  return response;
}

