'use client'
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-8">
      {/* Heading */}
      <h1 className="text-2xl md:text-4xl font-bold text-center mb-8">
        Welcome to Tables4U
      </h1>

      {/* Buttons Section */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Admin Column */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-center mb-4">Admin</h2>
          <Link href="/adminLogin">
            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
              Admin Login
            </button>
          </Link>
        </div>

        {/* Restaurant Column */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-center mb-4">Restaurant</h2>
          <Link href="/restaurantLogin">
            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
              Restaurant Manager Login
            </button>
          </Link>

          <Link href="/createRestaurant">
            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
              Create New Restaurant
            </button>
          </Link>
        </div>

        {/* Consumer Column */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-center mb-4">Consumer</h2>
          <Link href="/findReservation">
            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
              Find Existing Reservation
            </button>
          </Link>
          
          <Link href="/consumerDashboard">
            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
              Go to Consumer Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
