'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const instance = axios.create({
    baseURL: 'https://0mjckhjhy0.execute-api.us-east-2.amazonaws.com/Initial'
});

export default function consumerDashboard() {

    const [calendarDate, setCalendarDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('none');
    const [nameToSearch, setNameToSearch] = useState('');
    const [restaurants, setRestaurants] = useState<{ resId: number, name: string, address: string, openingHour: number, closingHour: number }[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<{ resId: number, name: string, address: string, openingHour: number, closingHour: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchRestaurantTrigger, setFetchRestaurantTrigger] = useState(true);
    const [minDate, setMinDate] = useState('');

    useEffect(() => {
        // Set minimum date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setMinDate(formattedDate);
        
        // If there's a currently selected date that's in the past, update it to today
        if (calendarDate && calendarDate < formattedDate) {
            setCalendarDate(formattedDate);
        }
    }, []);

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

    const updateFiltered = async () => {
        try {
            let updatedFilteredRestaurants = [...restaurants]; // Start with all restaurants

            // Filter by name if a search term is provided
            if (nameToSearch) {
                updatedFilteredRestaurants = updatedFilteredRestaurants.filter(restaurant =>
                    restaurant.name.toLowerCase().includes(nameToSearch.toLowerCase())
                );
            }

            // Filter by time if a time is selected
            if (selectedTime !== 'none') {
                const selectedHour = parseInt(selectedTime, 10);
                updatedFilteredRestaurants = updatedFilteredRestaurants.filter(restaurant =>
                    selectedHour >= restaurant.openingHour && selectedHour < restaurant.closingHour
                );
            }

            // Filter by closed days if a calendar date is selected
            if (calendarDate) {
                const closedDaysResponse = await instance.post('/fetchClosedRes', { day: calendarDate });
                const closedDaysData = JSON.parse(closedDaysResponse.data.body);

                if (closedDaysData && closedDaysData.data) {
                    const closedResIds = closedDaysData.data.map((day: { resId: any; }) => day.resId);
                    updatedFilteredRestaurants = updatedFilteredRestaurants.filter(restaurant =>
                        !closedResIds.includes(restaurant.resId)
                    );
                }

            }

            // Update the filtered restaurants state
            setFilteredRestaurants(updatedFilteredRestaurants);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        updateFiltered();
        console.log('test')
    }, [restaurants, nameToSearch, selectedTime, calendarDate]);

    const handleListRestaurant = () => {
        setFetchRestaurantTrigger(true);
    }

    const convertTo12HourFormat = (hour24: number) => {
        const suffix = hour24 < 12 ? 'AM' : 'PM';
        const hour12 = hour24 % 12 || 12; // Converts 0-23 to 1-12
        return `${hour12}:00 ${suffix}`;
    };

    return (

        <div className="p-4">
            <div className='flex justify-between'>
                <h1 className="text-2xl font-bold mb-4">
                    Consumer Dashboard
                </h1>

                <Link href="/">
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        &larr; Return to Landing Page
                    </button>
                </Link>
            </div>

            <div className="flex justify-center">
                <div className="w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="name" className="text-lg font-semibold">Restaurant Name</label>
                        <input
                            id="name"
                            type="text"
                            value={nameToSearch}
                            onChange={(e) => setNameToSearch(e.target.value)}
                            className="input-field border-2 border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label htmlFor="date" className="text-lg font-semibold">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={calendarDate}
                            min={minDate}
                            onChange={(e) => setCalendarDate(e.target.value)}
                            className="input-field border-2 border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col mb-4">
                        <label htmlFor="time" className="text-lg font-semibold">Time</label>
                        <select
                            className="border-2 border-gray-300 rounded px-3 py-3"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}>
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

            </div>

            {loading && <p className="mt-4 text-gray-500">Loading...</p>}

            {error && <p className="mt-4 text-red-500">{error}</p>}

            {filteredRestaurants && filteredRestaurants.length > 0 ? (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Restaurants:</h2>
                    {filteredRestaurants?.map((restaurant, index) => (
                        <Link
                            key={restaurant.resId}
                            href='consumerDashboard/restaurantDetails'>
                            <div
                                onClick={() => {
                                    localStorage.setItem(
                                        'restaurantDetails',
                                        JSON.stringify({
                                            resId: restaurant.resId,
                                            name: restaurant.name,
                                            openingHour: restaurant.openingHour,
                                            closingHour: restaurant.closingHour,
                                            date: calendarDate,
                                            time: selectedTime
                                        })
                                    );
                                }}
                                className="cursor-pointer border-2 border-gray-300 rounded-lg p-4 hover:bg-gray-100">
                                <h3 className="text-xl font-semibold">{restaurant.name}</h3>
                                <p className="text-gray-600">{restaurant.address}</p>
                                <p className="text-gray-600">{convertTo12HourFormat(restaurant.openingHour)} - {convertTo12HourFormat(restaurant.closingHour)}</p>
                            </div>
                        </Link>
                    ))}
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