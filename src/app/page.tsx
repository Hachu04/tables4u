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
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Buttons */}
        <div className="flex flex-col gap-4">
          <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Find Existing Reservation
          </button>
          <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Restaurant Manager Login
          </button>
          <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Admin Login
          </button>
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-col gap-4">
        <Link href="/createRestaurant">
          <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Create New Restaurant
          </button>
        </Link>
          
          <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Go to Consumer Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
