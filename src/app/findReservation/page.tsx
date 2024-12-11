'use client';
import React, { useState } from 'react';
import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://0mjckhjhy0.execute-api.us-east-2.amazonaws.com/Initial'
});

export default function FindReservationPage() {
    const [reservationInfo, setReservationInfo] = useState({
        email: '',
        confirmationCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [reservationDetails, setReservationDetails] = useState<any | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setReservationInfo({
            ...reservationInfo,
            [name]: value,
        });
    };

    const handleFindReservation = async () => {
        try {
            setLoading(true);
            setReservationDetails(null);
            setErrorMessage(null);

            // Make API request
            const response = await instance.post('/findExistingReservation', reservationInfo);

            if (response.data.statusCode === 200) {
                const data = JSON.parse(response.data.body);
                setReservationDetails(data);
            } else {
                setErrorMessage(JSON.parse(response.data.body));
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error || 'Failed to find the reservation. Please try again.'
                );
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReservation = async () => {
        if (!reservationDetails) return;

        try {
            setLoading(true);
            setErrorMessage(null);

            // Make delete request
            const response = await instance.post(`/deleteReservation`, reservationDetails.rsvId);

            if (response.data.statusCode === 200) {
                setReservationDetails(null);
                alert('Reservation deleted successfully!');
            } else {
                setErrorMessage(JSON.parse(response.data.body));
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error || 'Failed to delete the reservation. Please try again.'
                );
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Find Existing Reservation</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Email</label>
                        <input
                            type="text"
                            name="email"
                            value={reservationInfo.email}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                            placeholder="Enter email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Confirmation Code</label>
                        <input
                            type="text"
                            name="confirmationCode"
                            value={reservationInfo.confirmationCode}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                            placeholder="Enter confirmation code"
                        />
                    </div>
                </form>
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                        onClick={() => setReservationInfo({ email: '', confirmationCode: '' })}
                    >
                        Reset
                    </button>
                    <button
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                        onClick={handleFindReservation}
                    >
                        Find
                    </button>
                </div>
                {loading && <p className="mt-4 text-gray-500">Loading...</p>}
                {reservationDetails && (
                    <div className="mt-8 p-4 border rounded bg-green-50">
                        <h2 className="text-xl font-semibold mb-2">Reservation Details</h2>
                        <p><strong>Restaurant:</strong> {reservationDetails.resName}</p>
                        <p><strong>Table Number:</strong> {reservationDetails.tableNum}</p>
                        <p><strong>Number of Guests:</strong> {reservationDetails.numGuests}</p>
                        <p><strong>Reserved Time:</strong> {reservationDetails.reservedTime}</p>
                        <button
                            className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
                            onClick={handleDeleteReservation}
                        >
                            Delete Reservation
                        </button>
                    </div>
                )}
                {errorMessage && (
                    <div className="mt-8 p-4 border rounded bg-red-50">
                        <h2 className="text-xl font-semibold mb-2">Error</h2>
                        <p>{errorMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
