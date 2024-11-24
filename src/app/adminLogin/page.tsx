'use client';
import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

// API instance for making requests
const instance = axios.create({
  baseURL: 'https://7u4s1jaoj8.execute-api.us-east-2.amazonaws.com/Initial', // Replace with your API base URL
});

export default function createAdminLoginPage(){

    return("This is the Admin Login Page")
    
}