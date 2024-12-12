'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

// API instance for making requests
const instance = axios.create({
    baseURL: 'https://vqh08ym9ml.execute-api.us-east-2.amazonaws.com/Initial/',
});

interface Table {
    tableNum: number;
    numSeats: number;
    reservedEmail: string | null;
}

interface TimeSlot {
    hour: number;
    availableTables: Table[];
}

export default function RestaurantAvailability() {
    const [currentDate, setCurrentDate] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvailabilityData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Missing token');
                }

                const response = await instance.post('/reviewAvailability', { token });

                if (response.data.statusCode !== 200) {
                    throw new Error(response.data.error || 'Failed to fetch availability');
                }

                const data = JSON.parse(response.data.body);

                setCurrentDate(data.date);
                setTimeSlots(data.timeSlots);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchAvailabilityData();
    }, []);

    const formatHour = (hour: number): string => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };
    
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

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto bg-white shadow rounded">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold">Restaurant Availability - {currentDate}</h1>
                    <Link href='/restaurantDashboard'>
                    <button
                        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                    >
                        Return to Restaurant Dashboard
                    </button>
                </Link>
                </div>
                <div className="p-6">
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
                                                    {table ? (table.reservedEmail ? `Reserved by ${table.reservedEmail}` : `${table.numSeats} seats`) : 'Reserved'}
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
        </div>
    );
}