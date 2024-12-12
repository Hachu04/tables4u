'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const instance = axios.create({
    baseURL: 'https://0mjckhjhy0.execute-api.us-east-2.amazonaws.com/Initial'
});

export default function consumerDashboard() {

    const [calendarDate, setCalendarDate] = useState('');
    const [restaurants, setRestaurants] = useState<{ resId: number, name: string, address: string, openingHour: number, closingHour: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRestaurants, setShowRestaurants] = useState(false);
    const [fetchRestaurantTrigger, setFetchRestaurantTrigger] = useState(true);

    // Automatically shows any active restaurants when consumers click on consumer dashboard from landing page
    useEffect(() => {
        if (fetchRestaurantTrigger) {
            getActiveRestaurants();
            setFetchRestaurantTrigger(false);
        }
    }, []);

    // Get active restaurant names from database
    const getActiveRestaurants = async () => {

        try {

            setLoading(true); // Show loading state
            setError(null);   // Reset any previous errors

            // Call your Lambda function endpoint 
            const response = await instance.get('consumerListRestaurant')
            // Update webpage with the restaurant data
            console.log(response.data.body)
            setRestaurants(response.data.body);
            setShowRestaurants(true);

        } catch (error) {
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

    const handleListRestaurant = () => {
        setFetchRestaurantTrigger(true);
    }

    return (

        <div className="p-4">

            <h1 className="text-2xl font-bold mb-4">
                Consumer Dashboard
            </h1>
            <div className="flex justify-center">
                <div className="w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="name" className="text-lg font-semibold">Restaurant Name</label>
                        <input
                            id="name"
                            type="text"

                            className="input-field border-2 border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label htmlFor="date" className="text-lg font-semibold">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={calendarDate}
                            onChange={(e) => setCalendarDate(e.target.value)}
                            className="input-field border-2 border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label htmlFor="time" className="text-lg font-semibold">Time</label>
                        <select className="border-2 border-gray-300 rounded px-3 py-3">
                            <option value="none">No Time Preference</option>
                            <option value="00">12:00 AM</option>
                            <option value="01">1:00 AM</option>
                            <option value="02">2:00 AM</option>
                            <option value="03">3:00 AM</option>
                            <option value="04">4:00 AM</option>
                            <option value="05">5:00 AM</option>
                            <option value="06">6:00 AM</option>
                            <option value="07">7:00 AM</option>
                            <option value="08">8:00 AM</option>
                            <option value="09">9:00 AM</option>
                            <option value="10">10:00 AM</option>
                            <option value="11">11:00 AM</option>
                            <option value="12">12:00 PM</option>
                            <option value="13">1:00 PM</option>
                            <option value="14">2:00 PM</option>
                            <option value="15">3:00 PM</option>
                            <option value="16">4:00 PM</option>
                            <option value="17">5:00 PM</option>
                            <option value="18">6:00 PM</option>
                            <option value="19">7:00 PM</option>
                            <option value="20">8:00 PM</option>
                            <option value="21">9:00 PM</option>
                            <option value="22">10:00 PM</option>
                            <option value="23">11:00 PM</option>
                        </select>
                    </div>
                </div>
            </div>

            <button
                onClick={handleListRestaurant}
                className="w-full bg-green-500 text-white py-3 rounded hover:bg-blue-600 transition"
            >
                List Restaurants
            </button>

            <div className="absolute bottom-4 left-4">
                <Link href="/">
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        &larr; Return to Landing Page
                    </button>
                </Link>
            </div>

            {loading && <p className="mt-4 text-gray-500">Loading...</p>}

            {error && <p className="mt-4 text-red-500">{error}</p>}

            {showRestaurants && restaurants && restaurants.length > 0 ? (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Restaurants:</h2>
                    <ul className="list-disc pl-5">

                        {restaurants.map((restaurant, index) => (
                            <li key={index} className="mb-2">
                                {restaurant.name} — {restaurant.address}
                            </li>
                        ))}

                    </ul>
                </div>
            ) : (
                <p className="mt-4 text-gray-500">
                    {!restaurants || restaurants.length == 0
                        ? 'No restaurants available currently. Click list restaurants to see any updates.'
                        : 'Please wait...'
                    }
                </p>
            )}

        </div>

    )

}