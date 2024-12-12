'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '../utils/LoadingSpinner';
import { EditRestaurantPopup } from './components/EditRestaurantPopup';
import { EditTablesPopup } from './components/EditTablesPopup';
import { ActivateRestaurantPopup } from './components/ActivateRestaurantPopup';
import { DeleteRestaurantPopup } from './components/DeleteRestaurantPopup';

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
  const [fetchTablesTrigger, setFetchTablesTrigger] = useState(true);
  const [fetchRestaurantTrigger, setFetchRestaurantTrigger] = useState(true);
  const [checkTokenTrigger, setCheckTokenTrigger] = useState(true);

  const andRefreshDisplay = () => {
    forceRedraw(redraw + 1)
  }

  useEffect(() => {
    if (checkTokenTrigger) {
      checkToken();
      setCheckTokenTrigger(false); // Reset the trigger
    }
  }, [checkTokenTrigger]);

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
    if (fetchRestaurantTrigger) {
      fetchRestaurantData();
      setFetchRestaurantTrigger(false); // Reset the trigger
    }
  }, [fetchRestaurantTrigger]);

  useEffect(() => {
    if (fetchTablesTrigger) {
      fetchTables();
      setFetchTablesTrigger(false); // Reset the trigger
    }
  }, [fetchTablesTrigger]);

  const handleEditRestaurantClick = () => {
    setShowEditPopup(true);
    setResponseMsg('');
    setErrorMessage('');
  };

  const handleCloseEditRestaurantPopup = () => {
    setShowEditPopup(false);
    setResponseMsg('');
    setErrorMessage('');
    setFetchRestaurantTrigger(true);
  };

  const handleOpenEditTablePopup = () => {
    setFetchTablesTrigger(true); // Fetch existing tables when opening the popup
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
        setFetchTablesTrigger(true); // Refresh the table list
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
        setFetchTablesTrigger(true);
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
    setResponseMsg('');
    setErrorMessage('');
  };

  const handleCloseActivateRestaurantPopup = () => {
    setShowActivatePopup(false);

    setErrorMessage('');
    setResponseMsg('');
    setFetchRestaurantTrigger(true);
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
    //window.location.href = '/'; // Redirect to landing page
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
          <Link href='/'>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </Link>
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
          <Link href='/restaurantDashboard/reviewAvailability'>
            <button
              className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
              style={{ visibility: activeVisibility() }}
            >
              Review Availability
            </button>
          </Link>
          

          <Link href="/restaurantDashboard/editFutureDay">
            {/* Open/Reopen Button */}
            <button
              className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
              style={{ visibility: activeVisibility() }}
            >
              Open/Reopen
            </button>
          </Link>

          {/* Delete Restaurant Button */}
          <button onClick={handleDeleteRestaurantClick} className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition">
            Delete Restaurant
          </button>
        </div>
      </div>

      {/* Edit Restaurant Popup */}
      {showEditPopup && (
        <EditRestaurantPopup
          restaurantData={restaurantData}
          onClose={handleCloseEditRestaurantPopup}
          onSave={handleSaveChanges}
          onInputChange={handleInputChange}
          loading={loading}
          responseMsg={responseMsg}
          errorMessage={errorMessage}
        />
      )}

      {/* Activate Restaurant Popup */}
      {showActivatePopup && (
        <ActivateRestaurantPopup
          onClose={handleCloseActivateRestaurantPopup}
          onConfirm={handleConfirmActivate}
          loading={loading}
          responseMsg={responseMsg}
          errorMessage={errorMessage}
        />
      )}

      {/* Edit Table Popup */}
      {showEditTablePopup && (
        <EditTablesPopup
          tables={tables}
          newTable={newTable}
          onNewTableChange={(e) => setNewTable({ ...newTable, [e.target.name]: e.target.value })}
          onAddTable={createTable}
          onDeleteTable={deleteTable}
          onClose={handleCloseEditTablePopup}
          loading={loading}
          responseMsg={responseMsg}
          errorMessage={errorMessage}
        />
      )}

      {/* Delete Restaurant Popup */}
      {showDeletePopup && (
        <DeleteRestaurantPopup
          onClose={handleCancelDeleteRestaurant}
          onConfirm={handleConfirmDelete}
          loading={loading}
          responseMsg={responseMsg}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
}