'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

type RestaurantDetails = {
    resId: string;
    name: string;
    openingHour: number;
    closingHour: number;
    date: string;
    time: string;
};

interface Table {
    tableNum: number;
    numSeats: number;
    reservedEmail: string | null;
}

interface TimeSlot {
    hour: number;
    availableTables: Table[];
}

interface ReservationData {
    email: string;
    name: string;
    resId: string;
    tableNum: number;
    numGuests: number;
    reservedTime: string;
}

interface ReservationResponse {
    email: string;
    name: string;
    resName: string;
    tableNum: number;
    numGuests: number;
    reservedTime: string;
    confirmationCode: string;
}

const instance = axios.create({
    baseURL: 'https://0mjckhjhy0.execute-api.us-east-2.amazonaws.com/Initial',
});

const RestaurantAvailability = () => {
    const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [calendarDate, setCalendarDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('none');
    const [timeOptions, setTimeOptions] = useState<string[]>([]);

    // Reservation popup states
    const [showReservationPopup, setShowReservationPopup] = useState(false);
    const [reservationData, setReservationData] = useState<ReservationData>({
        email: '',
        name: '',
        resId: '',
        tableNum: 0,
        numGuests: 1,
        reservedTime: '',
    });
    const [reservationError, setReservationError] = useState<string | null>(null);
    const [reservationSuccess, setReservationSuccess] = useState<ReservationResponse | null>(null);
    const [minDate, setMinDate] = useState('');

    useEffect(() => {
        // Set minimum date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setMinDate(formattedDate);

        // If there's a currently selected date that's in the past, update it to today
        if (calendarDate && calendarDate < formattedDate) {
            setCalendarDate(formattedDate);
        }
    }, []);

    const fetchAvailability = async (resId: string, date?: string, time?: string) => {
        try {
            const payload = { resId, date, time };
            console.log(payload)
            const response = await instance.post('/fetchAvailabilityRsv', payload);
            console.log(response);

            if (response.data.statusCode !== 200) {
                throw new Error(response.data.error || 'Failed to fetch availability');
            }

            const data = JSON.parse(response.data.body);
            setTimeSlots(data.timeSlots);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    useEffect(() => {
        const details = localStorage.getItem('restaurantDetails');

        if (details) {
            try {
                const parsedDetails = JSON.parse(details);
                if (
                    parsedDetails &&
                    typeof parsedDetails === 'object' &&
                    'resId' in parsedDetails &&
                    'name' in parsedDetails &&
                    'openingHour' in parsedDetails &&
                    'closingHour' in parsedDetails &&
                    'date' in parsedDetails &&
                    'time' in parsedDetails
                ) {

                    setRestaurantDetails(parsedDetails as RestaurantDetails);
                    const date = parsedDetails.date || new Date().toISOString().slice(0, 10);
                    setCalendarDate(date);
                    setSelectedTime(
                        parsedDetails.time === "none"
                            ? "none"
                            : parsedDetails.time.includes(":")
                                ? parsedDetails.time
                                : `${parsedDetails.time}:00`
                    );
                    fetchAvailability(parsedDetails.resId, parsedDetails.date, parsedDetails.time);
                } else {
                    console.error('Invalid restaurant details format in localStorage');
                }
            } catch (err) {
                console.error('Error parsing restaurant details from localStorage:', err);
            }
        } else {
            console.error('No restaurant details found in localStorage');
        }
    }, []);


    useEffect(() => {
        const generateTimeOptions = (start: number, end: number) => {
            const times = [];
            for (let hour = start; hour <= end; hour++) {
                const formattedHour = hour < 10 ? `0${hour}:00` : `${hour}:00`;
                times.push(formattedHour);
            }
            return times;
        };

        if (restaurantDetails) {
            const options = generateTimeOptions(restaurantDetails.openingHour, restaurantDetails.closingHour);
            setTimeOptions(options);
        }
    }, [restaurantDetails?.openingHour, restaurantDetails?.closingHour]);

    const formatHour = (hour: number): string => `${hour.toString().padStart(2, '0')}:00`;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    const allTables = new Set<number>();
    timeSlots.forEach((slot) => {
        slot.availableTables.forEach((table) => allTables.add(table.tableNum));
    });

    const sortedTables = Array.from(allTables).sort((a, b) => a - b);

    const handleReservationClick = (tableNum: number, timeSlot: number) => {
        const formattedTime = `${calendarDate} ${timeSlot.toString().padStart(2, '0')}:00:00`;
        setReservationData({
            ...reservationData,
            resId: restaurantDetails?.resId || '',
            tableNum: tableNum,
            reservedTime: formattedTime,
        });
        setShowReservationPopup(true);
        setReservationError(null);
        setReservationSuccess(null);
    };

    const handleReservationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setReservationData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleMakeReservation = async () => {
        try {
            setReservationSuccess(null);
            setReservationError(null);
            const response = await instance.post('/makeReservation', reservationData);

            if (response.data.statusCode === 400) {
                const parsedBody = JSON.parse(response.data.body);
                setReservationError(parsedBody.error || 'Failed to make reservation');
            }

            if (response.data.statusCode === 200) {
                const reservationDetails: ReservationResponse = JSON.parse(response.data.body);
                setReservationSuccess(reservationDetails);

                if (restaurantDetails) {
                    fetchAvailability(restaurantDetails.resId, calendarDate, selectedTime);
                }
            }
        } catch (err) {
            setReservationError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto bg-white shadow rounded">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold">{restaurantDetails?.name}</h1>
                    {restaurantDetails && (
                        <div className="mt-4">
                            <p><strong>Opening Hours:</strong> {restaurantDetails.openingHour} - {restaurantDetails.closingHour}</p>
                        </div>
                    )}
                    <Link href="/consumerDashboard">
                        <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
                            Return to Consumer Dashboard
                        </button>
                    </Link>
                </div>
                <div className="p-6">
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
                    <div className="flex flex-col mb-4">
                        <label htmlFor="time" className="text-lg font-semibold">Time</label>
                        <select
                            id="time"
                            className="border-2 border-gray-300 rounded px-3 py-3"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        >
                            <option value="none">No Time Preference</option>
                            {timeOptions.map((time) => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            if (restaurantDetails) {
                                console.log(selectedTime);
                                fetchAvailability(restaurantDetails.resId, calendarDate, selectedTime);
                            }
                        }}
                        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
                    >
                        Fetch Availability
                    </button>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-left">Time</th>
                                    {sortedTables.map((tableNum) => (
                                        <th key={tableNum} className="px-4 py-2 text-center">Table {tableNum}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map((slot) => (
                                    <tr key={slot.hour} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{formatHour(slot.hour)}</td>
                                        {sortedTables.map((tableNum) => {
                                            const table = slot.availableTables.find((t) => t.tableNum === tableNum);
                                            return (
                                                <td key={tableNum} className="px-4 py-3 text-center">
                                                    {table ? (
                                                        table.reservedEmail ? (
                                                            `Reserved by ${table.reservedEmail}`
                                                        ) : (
                                                            <button
                                                                className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition"
                                                                onClick={() => handleReservationClick(tableNum, slot.hour)}
                                                            >
                                                                Reserve ({table.numSeats} seats)
                                                            </button>
                                                        )
                                                    ) : (
                                                        'Reserved'
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Reservation Popup */}
            {showReservationPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        {!reservationSuccess ? (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Make Reservation</h2>
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={reservationData.name}
                                            onChange={handleReservationInputChange}
                                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={reservationData.email}
                                            onChange={handleReservationInputChange}
                                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Number of Guests
                                        </label>
                                        <input
                                            type="number"
                                            name="numGuests"
                                            value={reservationData.numGuests}
                                            onChange={handleReservationInputChange}
                                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <p className="text-gray-600">
                                            <strong>Table:</strong> {reservationData.tableNum}
                                        </p>
                                        <p className="text-gray-600">
                                            <strong>Time:</strong> {reservationData.reservedTime}
                                        </p>
                                    </div>
                                </form>

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                                        onClick={() => setShowReservationPopup(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                                        onClick={handleMakeReservation}
                                    >
                                        Confirm Reservation
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-green-600">Reservation Confirmed!</h2>
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <div className="space-y-2">
                                        <p><span className="font-semibold">Confirmation Code:</span> {reservationSuccess.confirmationCode}</p>
                                        <p><span className="font-semibold">Restaurant:</span> {reservationSuccess.resName}</p>
                                        <p><span className="font-semibold">Name:</span> {reservationSuccess.name}</p>
                                        <p><span className="font-semibold">Email:</span> {reservationSuccess.email}</p>
                                        <p><span className="font-semibold">Table Number:</span> {reservationSuccess.tableNum}</p>
                                        <p><span className="font-semibold">Number of Guests:</span> {reservationSuccess.numGuests}</p>
                                        <p><span className="font-semibold">Date & Time:</span> {reservationSuccess.reservedTime}</p>
                                    </div>
                                </div>
                                <button
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                                    onClick={() => {
                                        setShowReservationPopup(false);
                                        setReservationSuccess(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {reservationError && (
                            <div className="mt-4 p-4 border rounded bg-red-50">
                                <p className="text-red-600">{reservationError}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantAvailability;

