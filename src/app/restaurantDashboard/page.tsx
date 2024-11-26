'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '../utils/LoadingSpinner';

// API instance for making requests
const instance = axios.create({
  baseURL: 'https://vqh08ym9ml.execute-api.us-east-2.amazonaws.com/Initial/',
});

export default function RestaurantManagerDashboard() {
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showEditTablePopup, setShowEditTablePopup] = useState(false);
  const [showActivatePopup, setShowActivatePopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [responseMsg, setResponseMsg] = useState('')
  const [errorMessage, setErrorMessage] = useState('');
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    isActive: 0,
    openingHour: '',
    closingHour: '',
  });
  const [redraw, forceRedraw] = React.useState(0);

  type Table = {
    tableNum: number;
    numSeats: number;
  };

  const [tables, setTables] = useState<Table[]>([]);
  const [newTable, setNewTable] = useState({ tableNum: '', numSeats: '' });
  const [loading, setLoading] = useState(false);


  const andRefreshDisplay = () => {
    forceRedraw(redraw + 1)
  }

  const checkToken = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found!');
        return;
      }

      const response = await instance.post('checkToken', { token });

      const { statusCode, body } = response.data;
      const parsedBody = JSON.parse(body);
      if (statusCode === 400) {
        if (parsedBody.error === 'Invalid token: jwt expired') {
          alert('Session expired, you will not be able to execute tasks. Please click logout and login again');
        }
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to check token.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    }
  };

  // Fetch restaurant data on component mount
  const fetchRestaurantData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found!');
        return;
      }

      const response = await instance.post('getResInfo', { token });

      const { statusCode, body } = response.data;
      const parsedBody = JSON.parse(body);
      if (statusCode === 200) {
        setRestaurantData({
          name: parsedBody.name || '',
          address: parsedBody.address || '',
          isActive: parsedBody.isActive || 0,
          openingHour: parsedBody.openingHour || '',
          closingHour: parsedBody.closingHour || ''
        });
        andRefreshDisplay();
        console.log(JSON.stringify(response));
      } else {
        if (parsedBody.error === 'No restaurant found for the given manager email') {
          alert('No restaurant found for the given manager email. Please click logout to go back to landing page');
        }
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to fetch restaurant data.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
    fetchRestaurantData();
  }, []);

  const handleEditRestaurantClick = () => {
    setShowEditPopup(true);
  };

  const handleCloseEditRestaurantPopup = () => {
    setShowEditPopup(false);
    setResponseMsg('');
    setErrorMessage('');
    fetchRestaurantData();
  };

  const handleOpenEditTablePopup = () => {
    fetchTables(); // Fetch existing tables when opening the popup
    setShowEditTablePopup(true);
  };

  const handleCloseEditTablePopup = () => {
    setShowEditTablePopup(false);
    setResponseMsg('');
    setErrorMessage('');
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found!');
        return;
      }

      const response = await instance.post('getTables', { token });
      const { statusCode, body } = response.data

      if (statusCode === 200) {
        const parsedBody = JSON.parse(body);
        setTables(parsedBody.tables);
      } else {
        const parsedBody = JSON.parse(body);
        setTables([]);
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to fetch tables data.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setResponseMsg('');
    setErrorMessage('');
    if (!newTable.tableNum || !newTable.numSeats) {
      setErrorMessage('Please fill in both fields.');
      return;
    }

    if (parseInt(newTable.numSeats) < 1 || parseInt(newTable.numSeats) > 8) {
      setErrorMessage('Number of seats must be 1-8');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found!');
        return;
      }

      const response = await instance.post('createTable', { token: token, tableNum: newTable.tableNum, numSeats: newTable.numSeats });

      console.log(JSON.stringify(response));

      const { statusCode, body } = response.data;
      const parsedBody = JSON.parse(body);

      if (statusCode === 200) {
        setResponseMsg('Table added successfully!');
        setNewTable({ tableNum: '', numSeats: '' }); // Reset the input fields
        fetchTables(); // Refresh the table list
      } else {
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to create table.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (tableNum: any) => {
    setResponseMsg('');
    setErrorMessage('');

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found!');
        return;
      }

      const response = await instance.post('deleteTable', { token: token, tableNum: tableNum });

      console.log(JSON.stringify(response));
      console.log(response.data.statusCode);

      const { statusCode, body } = response.data;

      console.log(statusCode);

      if (statusCode === 200) {
        setResponseMsg('Table deleted successfully!');
        fetchTables();
      } else {
        const parsedBody = JSON.parse(body)
        console.log("delete error: " + parsedBody.error);
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to delete table.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  }

  const handleActivateRestaurantClick = () => {
    setShowActivatePopup(true);
  };

  const handleCloseActivateRestaurantPopup = () => {
    setShowActivatePopup(false);

    setErrorMessage('');
    setResponseMsg('');
    fetchRestaurantData();
    andRefreshDisplay();
  }

  const handleDeleteRestaurantClick = () => {
    setShowDeletePopup(true);
  };

  const handleCancelDeleteRestaurant = () => {
    setShowDeletePopup(false);   
    setErrorMessage('');
    setResponseMsg(''); 
  }

  const handleSaveChanges = async () => {
    // Save changes logic here (make API call to update the data)
    console.log('Updated data:', restaurantData);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No token found!');
      return;
    }

    const payload = {
      token: token,
      name: restaurantData.name,
      address: restaurantData.address,
      openingHour: restaurantData.openingHour,
      closingHour: restaurantData.closingHour
    };

    if (restaurantData.isActive === 0) {
      setLoading(true);
      try {
        // Make API call to create the restaurant
        const response = await instance.post('editRestaurant', payload);

        const { statusCode, body } = response.data;
        console.log(JSON.stringify(response));

        if (statusCode === 200) {
          const parsedBody = JSON.parse(body); // Parse the response body
          setResponseMsg("Success! Restaurant information updated.");
        } else {
          const parsedBody = JSON.parse(body);
          setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data;
          setErrorMessage(
            errorData.message || 'Failed to update information.'
          );
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
        setResponseMsg('');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmActivate = async () => {
    // Save changes logic here (make API call to update the data)
    console.log('Updated data:', restaurantData);

    if (!restaurantData.openingHour || !restaurantData.closingHour) {
      setErrorMessage("Must set opeing hour and closing hour before activating")
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No token found!');
      return;
    }

    const payload = {
      token: token
    };

    setLoading(true);
    try {
      // Make API call to activate the restaurant
      const response = await instance.post('activateRestaurant', payload);

      const { statusCode, body } = response.data;
      console.log(JSON.stringify(response));

      if (statusCode === 200) {
        setResponseMsg("Success! Restaurant activated.");
      } else {
        const parsedBody = JSON.parse(body);
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to activate restaurant.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmDelete = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No token found!');
      return;
    }

    const payload = {
      token: token
    };

    setLoading(true);
    try {
      // Make API call to activate the restaurant
      const response = await instance.post('deleteRestaurant', payload);

      const { statusCode, body } = response.data;
      console.log(JSON.stringify(response));

      if (statusCode === 200) {
        setResponseMsg("Success! Restaurant deleted.");
      } else {
        const parsedBody = JSON.parse(body);
        setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        setErrorMessage(
          errorData.message || 'Failed to activate restaurant.'
        );
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setResponseMsg('');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRestaurantData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear token
    window.location.href = '/'; // Redirect to landing page
  };

  const isActiveFn = () => {
    if (restaurantData.isActive === 0) {
      return "Inactive"
    } else {
      return "Active"
    }
  }

  const inactiveVisibility = () => {
    if (restaurantData.isActive === 0) {
      return "visible"
    }
    return "hidden"
  }

  const activeVisibility = () => {
    if (restaurantData.isActive === 0) {
      return "hidden"
    }
    return "visible"
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

      {/* Show Loading Spinner when loading */}
      {loading && <LoadingSpinner />}


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
            style={{ visibility: inactiveVisibility() }}
          >
            Edit Restaurant
          </button>

          {/* Edit Tables Button */}
          <button
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
            onClick={handleOpenEditTablePopup}
            style={{ visibility: inactiveVisibility() }}
          >
            Edit Tables
          </button>

          {/* Activate Restaurant Button */}
          <button
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
            onClick={handleActivateRestaurantClick}
            style={{ visibility: inactiveVisibility() }}
          >
            Activate Restaurant
          </button>

          {/* Review Availability Button */}
          <button
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
            style={{ visibility: activeVisibility() }}
          >
            Review Availability
          </button>

          {/* Open/Reopen Button */}
          <button
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
            style={{ visibility: activeVisibility() }}
          >
            Open/Reopen
          </button>

          {/* Delete Restaurant Button */}
          <button onClick={handleDeleteRestaurantClick} className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition">
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

            {/* Display API response message */}
            {loading && <LoadingSpinner />}
            {responseMsg ? (
              <div className="mt-8 p-4 border rounded bg-green-50">
                <h2 className="text-xl font-semibold mb-2">Success!</h2>
                <p>{responseMsg}</p>

                <button
                  className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
                  onClick={handleCloseEditRestaurantPopup}
                >
                  Close
                </button>

              </div>
            ) : errorMessage ? (
              <div className="mt-8 p-4 border rounded bg-red-50">
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p>{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Activate Restaurant Popup */}
      {showActivatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Activate Restaurant?</h2>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                onClick={handleCloseActivateRestaurantPopup}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                onClick={handleConfirmActivate}
              >
                Confirm
              </button>
            </div>

            {/* Display API response message */}
            {loading && <LoadingSpinner />}
            {responseMsg ? (
              <div className="mt-8 p-4 border rounded bg-green-50">
                <h2 className="text-xl font-semibold mb-2">Success!</h2>
                <p>{responseMsg}</p>

                <button
                  className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
                  onClick={handleCloseActivateRestaurantPopup}
                >
                  Close
                </button>

              </div>
            ) : errorMessage ? (
              <div className="mt-8 p-4 border rounded bg-red-50">
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p>{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit Table Popup */}
      {showEditTablePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Edit Tables</h2>
            <form className="space-y-4">
              {/* Add Table Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Add Table
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTable.tableNum}
                    name="tableNum"
                    placeholder="Table Number"
                    className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                    onChange={(e) => setNewTable({ ...newTable, tableNum: e.target.value })}
                  />
                  <input
                    type="text"
                    value={newTable.numSeats}
                    name="numSeats"
                    placeholder="Seats"
                    className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                    onChange={(e) => setNewTable({ ...newTable, numSeats: e.target.value })}
                  />
                </div>
              </div>
            </form>

            {/* Existing Tables */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Existing Tables</h3>
              <ul className="space-y-4">
                {tables.map((table) => (
                  <li key={table.tableNum} className="flex justify-between items-center">
                    <span>
                      Table {table.tableNum} - {table.numSeats} seats
                    </span>
                    <button
                      className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 transition"
                      onClick={() => deleteTable(table.tableNum)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Display API response message */}
            {loading && <LoadingSpinner />}
            {responseMsg ? (
              <div className="mt-8 p-4 border rounded bg-green-50">
                <h2 className="text-xl font-semibold mb-2">Success!</h2>
                <p>{responseMsg}</p>
              </div>
            ) : errorMessage ? (
              <div className="mt-8 p-4 border rounded bg-red-50">
                <p>{errorMessage}</p>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                onClick={createTable}
              >
                Add Table
              </button>
              <button
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                onClick={handleCloseEditTablePopup}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Restaurant Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Delete Restaurant?</h2>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                onClick={handleCancelDeleteRestaurant}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                onClick={handleConfirmDelete}
              >
                Confirm
              </button>
            </div>

            {/* Display API response message */}
            {loading && <LoadingSpinner />}
            {responseMsg ? (
              <div className="mt-8 p-4 border rounded bg-green-50">
                <h2 className="text-xl font-semibold mb-2">Success!</h2>
                <p>{responseMsg}</p>

                <Link href='/'>
                  <button
                    className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
                  >
                    Back to Landing Page
                  </button>
                </Link>
              </div>
            ) : errorMessage ? (
              <div className="mt-8 p-4 border rounded bg-red-50">
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p>{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
