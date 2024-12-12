'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingSpinner from '../utils/LoadingSpinner';
import Link from 'next/link';

const instance = axios.create({
  baseURL: 'https://g8lcsp3jlc.execute-api.us-east-2.amazonaws.com/Initial/'
});

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<{ name: string; isActive: number }[]>([]);
  const [reservations, setReservations] = useState<any[]>([]); // For reservations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showReservations, setShowReservations] = useState(false); // For reservations

  // Fetch data helper
  const fetchData = async (
    endpoint: string,
    onSuccess: (data: any) => void,
    toggleVisibility: () => void
  ) => {
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

      const response = await instance.post(endpoint, { token });
      onSuccess(response.data);
      toggleVisibility();
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch restaurants
  const fetchRestaurantData = () => {
    fetchData(
      'adminListRestaurant',
      (data) => setRestaurants(data.restaurant),
      () => {
        setShowRestaurants(true);
        setShowReservations(false);
      }
    );
  };

  // Fetch reservations
  const fetchReservationsData = () => {
    fetchData(
      'adminListReservation',
      (data) => setReservations(data.reservation),
      () => {
        setShowReservations(true);
        setShowRestaurants(false);
      }
    );
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

  // Handle restaurant deletion
  const handleDeleteRestaurant = async (name: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      await instance.post('adminDeleteRestaurant', { name, token });
      setSuccess('Restaurant deleted successfully.');
      fetchRestaurantData(); // Refresh restaurant list
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle reservation cancellation
  const handleCancelReservation = async (rsvId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      await instance.post('adminCancelReservation', { rsvId, token });
      setSuccess('Reservation cancelled successfully.');
      fetchReservationsData(); // Refresh reservation list
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear token
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <Link href='/'>
        <button
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      </Link>

      {/* Display success or error message */}
      {success && <p className="mt-4 text-green-500">{success}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {/* List Restaurants button */}
      <button
        onClick={fetchRestaurantData}
        className="w-full bg-green-500 text-white py-3 rounded hover:bg-blue-600 transition"
      >
        List Restaurants
      </button>

      {/* List Reservations button */}
      <button
        onClick={fetchReservationsData}
        className="w-full bg-blue-500 text-white py-3 rounded hover:bg-green-600 transition mt-4"
      >
        List Reservations
      </button>

      {/* Loading spinner */}
      {loading && <LoadingSpinner />}

      {/* Show restaurant list after fetch */}
      {showRestaurants && restaurants.length > 0 && (
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
                <button
                  className="bg-red-500 text-white py-1 px-2 ml-4 rounded hover:bg-red-600 transition"
                  onClick={() => handleDeleteRestaurant(restaurant.name)}
                >
                  Delete Restaurant
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show reservation list after fetch */}
      {showReservations && reservations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Reservations:</h2>
          <ul className="list-disc pl-5">
            {reservations.map((reservation, index) => (
              <li key={index} className="mb-2">
                Reservation ID: {reservation.rsvId}, Email: {reservation.email}, Guests: {reservation.numGuest}, Time: {reservation.reservedTime}
                <button
                  className="bg-red-500 text-white py-1 px-2 ml-4 rounded hover:bg-red-600 transition"
                  onClick={() => handleCancelReservation(reservation.rsvId)}
                >
                  Cancel Reservation
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
