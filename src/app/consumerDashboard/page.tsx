'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function consumerDashboard(){

    const [restaurants, setRestaurants] = useState<{ name: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get active restaurant names from database
    const getActiveRestaurants = async () => {

        try{

            setLoading(true); // Show loading state
            setError(null);   // Reset any previous errors

            // Call your Lambda function endpoint (NOT SURE IF CORRECT LINK)
            const response = await axios.post('https://0mjckhjhy0.execute-api.us-east-2.amazonaws.com/Initial')

            // Update webpage with the restaurant data
            setRestaurants(response.data.restaurant);

        } catch (error){
            // Check what type of error might get
            if (axios.isAxiosError(error)) {

                console.error('Axios error:', error);
                const status = error.response?.status;

                if (status === 404) {

                  setError('Endpoint not found. Please check the API URL.');

                } else if (status === 401) {

                  setError('Unauthorized. Please log in again.');

                } else {

                  setError(error.response?.data?.error || 'Failed to load restaurants. Please try again.');

                }
              } else {

                console.error('Error fetching restaurants:', error);
                setError('An unexpected error occurred. Please try again.');

            }

        } finally {

            setLoading(false); // Hide loading state

        }

    }

    return(

        <div className = "p-4">

            <h1 className="text-2xl font-bold mb-4">
                Consumer Dashboard
            </h1>

            <button 
                onClick = {getActiveRestaurants}
                className="w-full bg-green-500 text-white py-3 rounded hover:bg-blue-600 transition"
            >
                List Restaurants
            </button>

            {loading && <p className="mt-4 text-gray-500">Loading...</p>}

            {error && <p className="mt-4 text-red-500">{error}</p>}

            {restaurants.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Restaurants:</h2>
                    <ul className="list-disc pl-5">

                        {restaurants.map((restaurant, index) => (
                            <li key={index} className="mb-2">
                                {restaurant.name} —{' '}
                            </li>
                        ))}

                    </ul>
                </div>
            )}

        </div>

    )

}