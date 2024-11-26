'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../utils/LoadingSpinner';

const instance = axios.create({
  baseURL: 'https://g8lcsp3jlc.execute-api.us-east-2.amazonaws.com/Initial/'
});

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
      const response = await instance.post('adminListRestaurant', {
        token, // Use the retrieved token
      });

      // Update state with the restaurant data
      setRestaurants(response.data.restaurant);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Axios error:', err);
        const status = err.response?.status;
        if (status === 404) {
          setError('Endpoint not found. Please check the API URL.');
        } else if (status === 401) {
          setError('Unauthorized. Please log in again.');
        } else {
          setError(err.response?.data?.error || 'Failed to load restaurants. Please try again.');
        }
      } else {
        console.error('Error fetching restaurants:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false); // Hide loading state
    }
  };

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