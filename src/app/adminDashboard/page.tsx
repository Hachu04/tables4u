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
  const [reservations, setReservations] = useState<any[]>([]);
  const [report, setReport] = useState<{ name: string; utilization: string; availability: string }[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Fetch data helper
  const fetchData = async (
    endpoint: string,
    payload: object,
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

      const response = await instance.post(endpoint, { ...payload, token });
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
      {},
      (data) => setRestaurants(data.restaurant),
      () => {
        setShowRestaurants(true);
        setShowReservations(false);
        setShowReport(false);
      }
    );
  };

  // Fetch reservations
  const fetchReservationsData = () => {
    fetchData(
      'adminListReservation',
      {},
      (data) => setReservations(data.reservation),
      () => {
        setShowReservations(true);
        setShowRestaurants(false);
        setShowReport(false);
      }
    );
  };

  // Fetch utilization report
  const fetchUtilizationReport = () => {
    if (!startDate || !endDate) {
      setError('Please provide both start and end dates.');
      return;
    }

    fetchData(
      'adminGenerateReport',
      { startDate, endDate },
      (data) => {
        // Parse the 'body' field to get the report data
        try {
          const parsedBody = JSON.parse(data.body);
          const activeRestaurants = parsedBody['active-restaurants'];
          if (Array.isArray(activeRestaurants)) {
            setReport(activeRestaurants);
          } else {
            setReport([]);
            setError('Unexpected report data format.');
          }
        } catch (err) {
          setReport([]);
          setError('Failed to parse report data.');
        }
      },
      () => {
        setShowReport(true);
        setShowRestaurants(false);
        setShowReservations(false);
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

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear token
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

      {/* Utilization Report Inputs */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Check Utilization & Availability</h2>
        <div className="flex flex-col gap-2 mt-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            placeholder="End Date"
          />
        </div>
        <button
          onClick={fetchUtilizationReport}
          className="w-full bg-purple-500 text-white py-3 rounded hover:bg-purple-600 transition mt-4"
        >
          Check Utilization
        </button>
      </div>

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

      {/* Show utilization report after fetch */}
      {showReport && (<> {report?.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Utilization Report:</h2>
          <ul className="list-disc pl-5">
            {report.map((item, index) => (
              <li key={index} className="mb-2">
                {item.name}: Utilization - {item.utilization}, Availability - {item.availability}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No utilization report data available for the selected dates.</p>
      )}
      </>
      )}
    </div>
  );
}
