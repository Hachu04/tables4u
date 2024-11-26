import mysql from 'mysql';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
    // Get credentials from the DB access layer (loaded separately via AWS console)
    var pool = mysql.createPool({
        host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
        user: "admin",
        password: "chuvietha11204",
        database: "res_manager"
    });

    // Function to get resId
    let GetResId = (email) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT Restaurant.resId
         FROM Restaurant
         JOIN RestaurantManager ON Restaurant.resId = RestaurantManager.ownedResId
         WHERE RestaurantManager.email = ?;`,
                [email],
                (error, rows) => {
                    if (error) {
                        return reject(error);
                    }
                    if (rows.length === 0) {
                        return reject(new Error('Restaurant not found.'));
                    }
                    return resolve(rows[0].resId);
                }
            );
        });
    };

    let DeleteTable = (tableNum, resId) => {
        return new Promise((resolve, reject) => {
            pool.query(
                "DELETE FROM ResTable WHERE tableNum=? AND resId=?;",
                [tableNum, resId],
                (error, rows) => {
                    if (error) {
                        return reject(error);
                    }
                    if ((rows) && (rows.affectedRows == 1)) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                }
            );
        });
    };

    // Extract the necessary fields from the event
    const { token, tableNum } = event;

    if (!token) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required authentication: token'
            }),
        };
    }

    if (!tableNum) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required fields: tableNum'
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

    if (role !== 'RestaurantManager') {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Incorrect role'
            }),
        };
    }

    // Delete the table with given table number and manager into the database
    let response;
    try {
        const resId = await GetResId(email)
        const result = await DeleteTable(tableNum, resId)
        if (result) {
            response = { statusCode: 200, body: { "success": true } }
        } else {
            response = {
                statusCode: 400,
                body: JSON.stringify({
                  error: 'No such table',
                }),
            }    
        }
    } catch (error) {
        response = {
            statusCode: 400,
            body: JSON.stringify({
              error: error,
            }),
        }    
    }

    // Close the DB connections
    pool.end();

    return response;
};
