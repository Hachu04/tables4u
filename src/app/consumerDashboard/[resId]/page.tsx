'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const instance = axios.create({
    baseURL: 'https://0mjckhjhy0.execute-api.us-east-2.amazonaws.com/Initial'
});


export default function RestaurantPage() {
    const params = useParams();
    const { resId } = params;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                Details {resId}
            </h1>
        </div>
    )
}