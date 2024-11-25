'use client'
import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

// API instance for making requests
const instance = axios.create({
  baseURL: 'https://vqh08ym9ml.execute-api.us-east-2.amazonaws.com/Initial/',
});

export default function RestaurantManagerDashboard() {
  const [showEditPopup, setShowEditPopup] = useState(false);

  console.log(localStorage.getItem('authToken'));

  const handleEditClick = () => {
    setShowEditPopup(true);
  };

  const handleClosePopup = () => {
    setShowEditPopup(false);
  };

  const handleSaveChanges = () => {
    // Handle save changes logic here
    console.log('Changes saved!');
    setShowEditPopup(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-8">
      {/* Heading */}
      <h1 className="text-2xl md:text-4xl font-bold text-center mb-8">
        Restaurant Manager Dashboard
      </h1>

      {/* Restaurant Information */}
      <div className="w-full max-w-3xl bg-gray-100 p-6 rounded shadow-lg">
        {/* Restaurant Name and Status */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            [Restaurant Name] - Active
          </h2>
          <button className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition">
            Logout
          </button>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Restaurant Button */}
          <button
            className="w-full bg-gray-300 text-gray-700 py-3 rounded hover:bg-gray-400 transition"
            onClick={handleEditClick}
          >
            Edit Restaurant
          </button>

          {/* Activate Restaurant Button */}
          <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
            Activate Restaurant
          </button>

          {/* Delete Restaurant Button */}
          <button className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition">
            Delete Restaurant
          </button>
        </div>
      </div>

      {/* Edit Restaurant Popup */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Edit Restaurant</h2>
            <form className="space-y-4">
              {/* Restaurant Name Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Enter restaurant name"
                />
              </div>

              {/* Hours of Operation Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Hours of Operation
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                />
              </div>

              {/* Number of Tables Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Number of Tables
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Enter table count"
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                onClick={handleClosePopup}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}