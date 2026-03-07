import httpx, asyncio, json

async def test_scans():
    print("--- Testing API Endpoints ---")
    async with httpx.AsyncClient(timeout=60) as client:
        # Test VirusTotal URL Scan
        print("\n[1] Testing URL Scan (google.com)...")
        try:
            resp = await client.post("http://localhost:8000/scan/url", json={"url": "google.com"})
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Result: {json.dumps(resp.json(), indent=2)[:500]}...")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Exception: {e}")

        # Test IP Scan
        print("\n[2] Testing IP Scan (8.8.8.8)...")
        try:
            resp = await client.post("http://localhost:8000/scan/ip", json={"ip": "8.8.8.8"})
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Result: {json.dumps(resp.json(), indent=2)[:500]}...")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Exception: {e}")

        # Test Identity Scan
        print("\n[3] Testing Identity Scan (test@example.com)...")
        try:
            resp = await client.post("http://localhost:8000/scan/identity", json={"email": "test@example.com"})
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"AI Summary: {resp.json().get('ai_summary')}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_scans())
