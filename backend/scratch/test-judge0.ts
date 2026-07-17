import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RAPIDAPI_KEY;
const apiHost = 'judge0-ce.p.rapidapi.com';

console.log('Testing Judge0 with Key starting with:', apiKey ? apiKey.substring(0, 8) + '...' : 'Undefined');
console.log('Testing with Host:', apiHost);

async function runTest() {
  const code = Buffer.from('#include <iostream>\nusing namespace std;\nint main() { cout << "Hello from Public Free Judge0!" << endl; return 0; }').toString('base64');
  
  const options = {
    method: 'POST',
    url: `https://ce.judge0.com/submissions`,
    params: { base64_encoded: 'true', wait: 'true' },
    headers: {
      'content-type': 'application/json',
    },
    data: {
      language_id: 75, // C++ Clang
      source_code: code,
    },
  };

  try {
    const response = await axios.request(options);
    console.log('🎉 SUCCESS! Response from Judge0:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.stdout) {
      console.log('Decoded Output:', Buffer.from(response.data.stdout, 'base64').toString('utf-8'));
    }
  } catch (error: any) {
    console.error('❌ FAILURE: Judge0 returned an error:');
    console.error(error.response?.data || error.message);
  }
}

runTest();
