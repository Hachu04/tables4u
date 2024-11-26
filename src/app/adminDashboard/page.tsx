'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<{ name: string; isActive: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurant data using token from localStorage
  const fetchRestaurantData = async () => {
    try {
      setLoading(true); // Show loading state
      setError(null);   // Reset any previous errors

      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      if (!token) {
        console.error('No token found!');
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      // Call your Lambda function endpoint
      const response = await axios.post('https://g8lcsp3jlc.execute-api.us-east-2.amazonaws.com/Initial', {
        token, // Use the retrieved token
      });

      // Update state with the restaurant data
      setRestaurants(response.data.restaurant);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  // Optional: Auto-fetch data when the component mounts
  useEffect(() => {
    fetchRestaurantData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <button
        onClick={fetchRestaurantData}
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
                <span
                  className={
                    restaurant.isActive
                      ? 'text-green-600 font-bold'
                      : 'text-red-600 font-bold'
                  }
                >
                  {restaurant.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}