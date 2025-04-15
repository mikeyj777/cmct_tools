
'''
To handle the async endpoints, you could adjust the test script to use the `aiohttp` library instead of `requests`. Here's how you could modify it:

```python
import asyncio
import json
import logging
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base URL of your Flask API
BASE_URL = "http://localhost:5000" # Change this to match your Flask server

async def test_radiation_analysis():
"""Test the radiation analysis endpoint"""
endpoint = f"{BASE_URL}/api/radiation_analysis"

# Sample request data - replace with your actual data structure
payload = {
# Add your test data here
"source_term": "example",
"parameters": {}
}

try:
async with aiohttp.ClientSession() as session:
async with session.post(endpoint, json=payload) as response:
logger.info(f"Status Code: {response.status}")

if response.status == 200:
data = await response.json()
logger.info("Radiation Analysis - Success")
logger.info(f"Response: {json.dumps(data, indent=2)}")
else:
text = await response.text()
logger.error(f"Radiation Analysis - Failed: {text}")

except Exception as e:
logger.error(f"Error in radiation analysis test: {str(e)}")

# Similarly modify other test functions...

# Run all tests asynchronously
async def run_all_tests():
logger.info("Starting API Tests")

# Run tests concurrently
await asyncio.gather(
test_radiation_analysis(),
test_flammable_envelope(),
test_flammable_mass(),
test_building_overpressure()
)

logger.info("Completed API Tests")

if __name__ == "__main__":
asyncio.run(run_all_tests())
```

You'll need to:

1. Install required libraries: `pip install requests aiohttp`
2. Update the `BASE_URL` to match your Flask server
3. Modify the payloads in each test function to match the expected request format
4. Choose which version of the script to use based on whether you want to test sequentially or concurrently

You can then run the script with:
```
python test_api.py
```

Would you like me to explain anything specific about this testing script or make any adjustments to better fit your needs?
'''