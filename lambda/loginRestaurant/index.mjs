import mysql from 'mysql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET_KEY;

export const handler = async (event) => {
    // Get credentials from the DB access layer (loaded separately via AWS console)
    var pool = mysql.createPool({
        host: "calcdb.cxcsos8q8549.us-east-2.rds.amazonaws.com",
        user: "admin",
        password: "chuvietha11204",
        database: "res_manager"
    });

    // Function to log into a new restaurant
    let LoginRestaurant = (email) => {
        return new Promise((resolve, reject) => {
            pool.query(
                "SELECT email, password FROM RestaurantManager WHERE email = ?;",
                [email],
                (error, rows) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(rows.length > 0 ? rows[0] : null);
                }
            );
        });
    };

    // Extract the necessary fields from the event
    const { email, password } = event;

    if (!email || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required fields: email or password'
            }),
        };
    }

    const isWhitespace = str => !str.replace(/\s/g, '').length

    if (isWhitespace(email) || isWhitespace(password)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'These fields contain only whitespace: email or password'
            })
        }
    }

    // Insert the new restaurant and manager into the database
    try {
        // Validate login credentials
        const manager = await LoginRestaurant(email);
        if (!manager) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid email or password'
                })
            }
        }

        // Compare input password with database's hashed password
        const isMatch = await bcrypt.compare(password, manager.password);
        if (!isMatch) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid email or password'
                })
            }
        }

        // Generate JWT token with expiration
        const token = jwt.sign(
            { email: manager.email, role: 'RestaurantManager' }, // payload
            SECRET_KEY,
            { expiresIn: '2h' } // token expires after 2 hours
        )

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Logged in',
                token: token
            })
        }
    } catch (error) {
        // Handle any database errors
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Internal server error: '
            })
        };
    }

    // Close the DB connections
    pool.end();
};
