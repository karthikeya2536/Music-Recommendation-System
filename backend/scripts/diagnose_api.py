import requests
import json
import ssl
from urllib3.util import create_urllib3_context

# Forced TLS 1.2+ configuration for modern API compatibility
class TLSAdapter(requests.adapters.HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        context = create_urllib3_context(ssl_version=ssl.PROTOCOL_TLS_CLIENT)
        kwargs['ssl_context'] = context
        return super(TLSAdapter, self).init_poolmanager(*args, **kwargs)

def diagnose_api():
    test_urls = [
        "https://saavn.dev/api/songs?id=YQsucjrt",
        "https://jiosaavn-api-ashutosh.vercel.app/api/songs?id=YQsucjrt",
        "https://saavn.me"
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Connection": "keep-alive"
    }

    session = requests.Session()
    session.mount("https://", TLSAdapter())

    for url in test_urls:
        print(f"Testing URL: {url}")
        try:
            response = session.get(url, headers=headers, timeout=15, verify=True)
            print(f"  - Status Code: {response.status_code}")
            if response.status_code == 200:
                print("  - SUCCESS: Connection established and data retrieved.")
                # Show snippet
                print(f"  - Data Snippet: {response.text[:100]}...")
            else:
                print(f"  - FAILED: Server returned error status.")
        except Exception as e:
            print(f"  - ERROR: {str(e)}")
            
        print("-" * 30)

if __name__ == "__main__":
    diagnose_api()
