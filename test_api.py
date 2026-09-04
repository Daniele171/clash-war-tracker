import os, json, urllib.request

token = os.environ.get('CR_API_KEY')
if not token:
    # Just parse the token from the user's message
    token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjdjYjY0ZTUyLTI3OTgtNDc3Mi04MTZmLTlkNDhmNTdhNGFhNiIsImlhdCI6MTc4ODUzMzYxNCwic3ViIjoiZGV2ZWxvcGVyL2RiODFmMzAwLWJhNGYtNDA5ZS04NmFkLTM3MWI4NjQ4ODg5YSIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxMjguMTI4LjEyOC4xMjgiLCI0NS43OS4yMTguNzkiXSwidHlwZSI6ImNsaWVudCJ9XX0.6tyWd4LnQolL1BwKGNO8mKfSd2-oMJZ36p8YoOKLlHp4fSp99dGCqZFX6HLLUkl88PORnB0WlMbZc7O_N2NerQ"

url = "https://proxy.royaleapi.dev/v1/clans/%23YLGVJVP2/currentriverrace"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"periodType: {data.get('periodType')}")
        print(f"periodIndex: {data.get('periodIndex')}")
        print(f"state: {data.get('state')}")
        
        # find Luciniddu
        luc = next((p for p in data['clan']['participants'] if p['name'] == 'Luciniddu'), None)
        print(f"Luciniddu: {luc}")
except Exception as e:
    print(f"Error: {e}")
