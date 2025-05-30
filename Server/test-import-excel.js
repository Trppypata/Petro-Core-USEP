const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testExcelImport() {
  try {
    const excelPath = path.resolve(__dirname, 'test-rocks.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('Test Excel file not found at:', excelPath);
      return;
    }
    
    console.log('Found test Excel file at:', excelPath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(excelPath));
    
    console.log('Sending Excel file to API...');
    
    // Make API request
    const response = await axios.post('http://localhost:8001/api/rocks/import', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('API Response:', response.status, response.statusText);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing Excel import:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
  }
}

testExcelImport(); 