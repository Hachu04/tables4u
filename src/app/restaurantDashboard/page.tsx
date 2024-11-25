'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

// API instance for making requests
const instance = axios.create({
  baseURL: 'https://vqh08ym9ml.execute-api.us-east-2.amazonaws.com/Initial/',
});

export default function RestaurantManagerDashboard() {
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showEditTablePopup, setShowEditTablePopup] = useState(false);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    openingHour: '',
    closingHour: '',
  });
  const [isActive, setIsActive] = useState(0)
  const [redraw, forceRedraw] = React.useState(0)

  const andRefreshDisplay = () => {
    forceRedraw(redraw + 1)
  }

  useEffect(() => {
    // Fetch restaurant data on component mount
    const fetchRestaurantData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No token found!');
          return;
        }

        const response = await instance.post('/getResInfo', { token });
        const parsedBody = JSON.parse(response.data.body);
        setRestaurantData({
          name: parsedBody.name || '',
          address: parsedBody.address || '',
          openingHour: parsedBody.openingHour || '',
          closingHour: parsedBody.closingHour || ''
        });
        setIsActive(parsedBody.isActive);
        andRefreshDisplay();
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
      }
    };

    fetchRestaurantData();
  }, []);

  const handleEditRestaurantClick = () => {
    setShowEditPopup(true);
  };

  const handleCloseEditRestaurantPopup = () => {
    setShowEditPopup(false);
  };

  const handleEditTableClick = () => {
    setShowEditTablePopup(true);
  }

  const handleCloseEditTablePopup = () => {
    setShowEditTablePopup(false);
  }

  const handleSaveChanges = () => {
    // Save changes logic here (make API call to update the data)
    console.log('Updated data:', restaurantData);
    setShowEditPopup(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRestaurantData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear token
    window.location.href = '/'; // Redirect to landing page
  };

  const isActiveFn = () => {
    if (isActive === 0) {
      return "Inactive"
    } else {
      return "Active"
    }
  }

  const getOperationHour = () => {
    if (!restaurantData.openingHour || !restaurantData.closingHour) {
      return "Set time in Edit"
    } else {
      return restaurantData.openingHour + ":00 - " + restaurantData.closingHour + ":00"
    }
  }

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
            {restaurantData.name} - {isActiveFn()}
          </h2>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-lg">
            Address: {restaurantData.address}
          </p>
          <p className="text-lg">
            Daily Schedule: {getOperationHour()}
          </p>
        </div>


        {/* Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Restaurant Button */}
          <button
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
            onClick={handleEditRestaurantClick}
          >
            Edit Restaurant
          </button>

          {/* Edit Tables Button */}
          <button
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
            onClick={handleEditTableClick}
          >
            Edit Tables
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
                  name="name"
                  value={restaurantData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Enter restaurant name"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={restaurantData.address}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Enter restaurant address"
                />
              </div>

              {/* Hours of Operation Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Hours of Operation
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="openingHour"
                    value={restaurantData.openingHour}
                    onChange={handleInputChange}
                    className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="Opening hour"
                  />
                  <input
                    type="text"
                    name="closingHour"
                    value={restaurantData.closingHour}
                    onChange={handleInputChange}
                    className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="Closing hour"
                  />
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                onClick={handleCloseEditRestaurantPopup}
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
