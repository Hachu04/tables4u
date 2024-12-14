'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '../../utils/LoadingSpinner';

// API instance for making requests
const instance = axios.create({
    baseURL: 'https://vqh08ym9ml.execute-api.us-east-2.amazonaws.com/Initial/',
});

export default function EditFutureDayPage() {
    const [calendarDate, setCalendarDate] = useState('');
    const [minDate, setMinDate] = useState('');
    const [responseMsg, setResponseMsg] = useState('')
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const [redraw, forceRedraw] = React.useState(0);

    useEffect(() => {
        // Set minimum date to tomorrow (since this is for future days)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];
        setMinDate(formattedDate);
        
        // If there's a currently selected date that's in the past or today, update it to tomorrow
        if (calendarDate && calendarDate <= new Date().toISOString().split('T')[0]) {
            setCalendarDate(formattedDate);
        }
    }, []);

    const andRefreshDisplay = () => {
        forceRedraw(redraw + 1)
    }

    const handleOpenClick = async () => {
        if (!calendarDate) {
            console.error('No date found!');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');

            const vars = {
                token: token,
                date: calendarDate
            }

            console.log(calendarDate);
            const response = await instance.post('openFutureDay', vars);

            const { statusCode, body } = response.data;
            console.log(JSON.stringify(response));

            if (statusCode === 200) {
                setResponseMsg("Success! Restaurant opened on " + calendarDate);
                setErrorMessage("");
            } else {
                const parsedBody = JSON.parse(body);
                setResponseMsg("");
                setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
            }
            andRefreshDisplay();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;
                setErrorMessage(
                    errorData.message || 'Failed to open restaurant.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
            setResponseMsg('');
        } finally {
            setLoading(false);
        }
    }

    const handleCloseClick = async () => {
        if (!calendarDate) {
            console.error('No date found!');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');

            const vars = {
                token: token,
                date: calendarDate
            }

            console.log(calendarDate);
            const response = await instance.post('closeFutureDay', vars);

            const { statusCode, body } = response.data;
            console.log(JSON.stringify(response));

            if (statusCode === 200) {
                setResponseMsg("Success! Restaurant closed on " + calendarDate);
                setErrorMessage("");
            } else {
                const parsedBody = JSON.parse(body);
                setResponseMsg("");
                setErrorMessage(parsedBody.error || 'An unexpected error occurred.');
            }
            andRefreshDisplay();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;
                setErrorMessage(
                    errorData.message || 'Failed to close restaurant.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
            setResponseMsg('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center py-8">
            {/* Return Button */}
            <div className="absolute top-4 left-4">
                <Link href="/restaurantDashboard">
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        &larr; Return
                    </button>
                </Link>
            </div>

            {/* Heading */}
            <h1 className="text-2xl md:text-4xl font-bold text-center mb-8">Open or Close Restaurant on Future Day</h1>

            <div className="flex flex-col mb-4">
                <label htmlFor="date" className="text-lg font-semibold">Date</label>
                <input
                    id="date"
                    type="date"
                    value={calendarDate}
                    min={minDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="input-field border-2 border-gray-300 rounded px-3 py-2"
                />
            </div>

            {/* Open Restaurant Button */}
            <button
                className="w-1/6 mb-4 bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
                onClick={handleOpenClick}
            >
                Open
            </button>

            {/* Close Restaurant Button */}
            <button
                className="w-1/6 bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
                onClick={handleCloseClick}
            >
                Close
            </button>

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
