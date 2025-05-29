/**
 * This script tests the direct import API endpoint
 * Run with: node test-import-connection.js
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// API URL
const API_URL = process.env.API_URL || 'http://localhost:8000/api';

async function testConnection() {
  try {
    console.log(`Testing connection to ${API_URL}/rocks/import-direct...`);
    
    // Simple test data (just a few rocks)
    const testRocks = [
      {
        rock_code: "TEST-001",
        name: "Test Rock 1",
        category: "Igneous",
        type: "Igneous",
        color: "Gray"
      },
      {
        rock_code: "TEST-002",
        name: "Test Rock 2",
        category: "Sedimentary",
        type: "Sedimentary",
        color: "Tan"
      }
    ];
    
    console.log(`Sending test data: ${JSON.stringify(testRocks, null, 2)}`);
    
    // Send the request
    const response = await axios.post(`${API_URL}/rocks/import-direct`, testRocks, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    console.log('Connection test completed successfully!');
    
  } catch (error) {
    console.error('Error testing connection:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    // Check server status
    try {
      console.log('\nChecking server status...');
      const statusResponse = await axios.get(`${API_URL}/rocks/stats`);
      console.log('Server is responding to other endpoints:', statusResponse.status);
    } catch (statusError) {
      console.error('Server is not responding to stats endpoint either:', statusError.message);
    }
  }
}

// Run the test
testConnection(); 