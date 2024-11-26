'use client'
import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '../utils/LoadingSpinner';

// API instance for making requests
const instance = axios.create({
  baseURL: 'https://vqh08ym9ml.execute-api.us-east-2.amazonaws.com/Initial/',
});

export default function RestaurantLoginPage() {
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantPassword, setRestaurantPassword] = useState('');
  const [responseMsg, setResponseMsg] = useState('')
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const credential = {
      email: restaurantEmail,
      password: restaurantPassword,
    };

    console.log(credential)

    setLoading(true);
    try {
      setErrorMessage('');
      setResponseMsg('');
      // Make API call to create the restaurant
      const response = await instance.post('loginRestaurant', credential);

      const { statusCode, body } = response.data;
      console.log(JSON.stringify(response));

      if (statusCode === 200) {
        const parsedBody = JSON.parse(body); // Parse the response body
        localStorage.setItem('authToken', parsedBody.token); // Save the token
        setResponseMsg(parsedBody.message);
        setErrorMessage('');
        setRestaurantEmail('');
        setRestaurantPassword('');
      } else {
        const parsedBody = JSON.parse(body);
        console.log(response)
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to create restaurant and manager.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-8">
      {/* Return Button */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
            &larr; Return to Landing Page
          </button>
        </Link>
      </div>

      {/* Heading */}
      <h1 className="text-2xl md:text-4xl font-bold text-center mb-8">Restaurant Login</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        {/* Form Fields */}

        <div className="flex flex-col">
          <label htmlFor="email" className="text-lg font-semibold">Email</label>
          <input
            id="email"
            type="email"
            value={restaurantEmail}
            onChange={(e) => setRestaurantEmail(e.target.value)}
            className="input-field border-2 border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="password" className="text-lg font-semibold">Password</label>
          <input
            id="password"
            type="password"
            value={restaurantPassword}
            onChange={(e) => setRestaurantPassword(e.target.value)}
            className="input-field border-2 border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex justify-center mt-4">
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Login
          </button>
        </div>
      </form>

      {/* Display API response message */}
      {loading && <LoadingSpinner />}
      {responseMsg ? (
        <div className="mt-8 p-4 border rounded bg-green-50">
          <h2 className="text-xl font-semibold mb-2">Success!</h2>
          <p>{responseMsg}</p>
          <Link href="/restaurantDashboard">
            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
              Go to Restaurant Manager Dashboard
            </button>
          </Link>
        </div>
      ) : errorMessage ? (
        <div className="mt-8 p-4 border rounded bg-red-50">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{errorMessage}</p>
        </div>
      ) : null}
    </main>
  );
}
