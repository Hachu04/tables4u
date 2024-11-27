'use client';
import React, { useState } from 'react';
import axios from 'axios';
import LoadingSpinner from '../utils/LoadingSpinner';
import Link from 'next/link';

const instance = axios.create({
  baseURL: 'https://g8lcsp3jlc.execute-api.us-east-2.amazonaws.com/Initial/'
});

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<{ name: string; isActive: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRestaurants, setShowRestaurants] = useState(false);

  // Fetch restaurant data using token from localStorage
  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      const response = await instance.post('adminListRestaurant', { token });
      setRestaurants(response.data.restaurant);
      setShowRestaurants(true);
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a restaurant and trigger re-fetch
  const handleDeleteRestaurant = async (restaurantName: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      const response = await instance.post('adminDeleteRestaurant', {
        name: restaurantName,
        token,
      });

      if (response.data.success) {
        // Immediately remove the restaurant from the list on success
        setRestaurants((prevRestaurants) =>
          prevRestaurants.filter((restaurant) => restaurant.name !== restaurantName)
        );
        setSuccess(`Restaurant "${restaurantName}" deleted successfully.`);
      } else {
        // If deletion fails, show error message
        setError('Failed to delete restaurant. Please try again.');
      }
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Axios errors
  const handleAxiosError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) {
        setError('Endpoint not found. Please check the API URL.');
      } else if (status === 401) {
        setError('Unauthorized. Please log in again.');
      } else {
        setError(err.response?.data?.error || 'An unexpected error occurred.');
      }
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear token
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Display success or error message */}
      {success && <p className="mt-4 text-green-500">{success}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {/* Loading spinner */}
      {loading && <LoadingSpinner />}

      {/* List Restaurants button always visible */}
      <button
        onClick={fetchRestaurantData}
        className="w-full bg-green-500 text-white py-3 rounded hover:bg-blue-600 transition"
      >
        List Restaurants
      </button>

      {/* Show restaurant list after fetch */}
      {showRestaurants && restaurants.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Restaurants:</h2>
          <Link href='/'>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </Link>
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
                <button
                  onClick={() => handleDeleteRestaurant(restaurant.name)}
                  className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                >
                  Delete Restaurant
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
