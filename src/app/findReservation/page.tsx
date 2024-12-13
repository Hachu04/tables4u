'use client';
import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '../utils/LoadingSpinner';

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
    const [responseMsg, setResponseMsg] = useState('')
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
            setResponseMsg('');
            setErrorMessage(null);

            const vars = {
                email: reservationInfo.email,
                confirmationCode: reservationInfo.confirmationCode
            }

            // Make API request
            const response = await instance.post('/findExistingReservation', vars);
            console.log(JSON.parse(response.data.body));

            if (response.data.statusCode === 400) {
                const body = JSON.parse(response.data.body)
                setErrorMessage(body.error);
            } else if (response.data.statusCode === 200) {
                const data = JSON.parse(response.data.body);
                setReservationDetails(data);
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
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
        if (!reservationDetails) {
            console.error('No reservation found!');
            return;
        }
        try {
            setLoading(true);
            setResponseMsg('');
            setErrorMessage(null);

            const vars = {
                rsvId: reservationDetails.rsvId
            }

            // Make delete request
            console.log(reservationDetails.rsvId);
            const response = await instance.post(`/consumerCancelReservation`, vars);

            const { statusCode, body } = response.data;
            console.log(JSON.stringify(response));

            if (statusCode === 200) {
                setReservationDetails(null);
                setResponseMsg('Reservation deleted successfully!');
            } else {
                const parsedBody = JSON.parse(body);
                setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
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
                <Link href='/'>
                    <button
                        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                    >
                        Return to Landing page
                    </button>
                </Link>
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
                            required
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
                            required
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
                {loading && (
                    <div className="flex items-center mt-4">
                        <LoadingSpinner />
                    </div>
                )}
                {!loading && reservationDetails && (
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
                {responseMsg ? (
                    <div className="mt-8 p-4 border rounded bg-green-50">
                        <h2 className="text-xl font-semibold mb-2">Success!</h2>
                        <p>{responseMsg}</p>
                        <Link href="/consumerDashboard">
                            <button className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition">
                                Go to Consumer Dashboard
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
    );
}
