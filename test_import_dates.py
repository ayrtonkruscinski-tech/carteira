#!/usr/bin/env python3

import requests
import tempfile
import os
import json

def test_csv_import_with_dates():
    """Test CSV import with purchase_date extraction"""
    
    base_url = "https://portfolio-tracker-114.preview.emergentagent.com/api"
    headers = {'Authorization': 'Bearer demo_session_token_123'}
    
    print("🔍 Testing CSV Import with Purchase Date Extraction...")
    
    # Step 1: Clear existing stocks
    print("   🗑️  Clearing existing stocks...")
    response = requests.delete(f"{base_url}/portfolio/stocks/all", headers=headers, timeout=10)
    print(f"   Clear response: {response.status_code}")
    
    # Step 2: Create test CSV with different date formats
    csv_content = """ticker,name,quantity,average_price,purchase_date,sector
PETR4,Petrobras PN,100,35.50,15/01/2024,Petróleo
VALE3,Vale ON,50,62.30,2024-02-20,Mineração
ITUB4,Itaú Unibanco PN,200,32.80,10/03/2024,Bancos
PETR4,Petrobras PN,50,40.00,20/01/2024,Petróleo"""
    
    print("   📄 CSV content:")
    print("   " + "\n   ".join(csv_content.split('\n')))
    
    # Step 3: Create temporary file and upload
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
        f.write(csv_content)
        temp_file_path = f.name
    
    try:
        with open(temp_file_path, 'rb') as f:
            files = {'file': ('test_portfolio.csv', f, 'text/csv')}
            
            print(f"   📤 Uploading to: {base_url}/portfolio/import")
            response = requests.post(f"{base_url}/portfolio/import", files=files, headers=headers, timeout=30)
            
            print(f"   📊 Import response: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Import result: {result}")
            else:
                print(f"   ❌ Import failed: {response.text}")
                return False
            
        # Step 4: Check imported stocks
        print("   📊 Checking imported stocks...")
        response = requests.get(f"{base_url}/portfolio/stocks", headers=headers, timeout=10)
        
        if response.status_code == 200:
            stocks = response.json()
            print(f"   📊 Found {len(stocks)} stocks:")
            
            for stock in stocks:
                ticker = stock.get('ticker')
                purchase_date = stock.get('purchase_date')
                quantity = stock.get('quantity')
                
                print(f"     {ticker}: quantity={quantity}, purchase_date='{purchase_date}'")
                
                # Check date format
                if purchase_date:
                    if len(purchase_date) == 10 and purchase_date[4] == '-' and purchase_date[7] == '-':
                        print(f"       ✅ Correct YYYY-MM-DD format")
                    else:
                        print(f"       ❌ Incorrect format (expected YYYY-MM-DD)")
                else:
                    print(f"       ❌ No purchase_date")
            
            # Check PETR4 aggregation
            petr4_stocks = [s for s in stocks if s.get('ticker') == 'PETR4']
            if len(petr4_stocks) == 1:
                petr4 = petr4_stocks[0]
                print(f"   📊 PETR4 aggregation: quantity={petr4.get('quantity')}, date={petr4.get('purchase_date')}")
                
                if petr4.get('quantity') == 150:
                    print(f"     ✅ Quantity correctly aggregated (100+50=150)")
                else:
                    print(f"     ❌ Quantity not aggregated correctly")
                    
                # Check if earliest date was kept (15/01/2024 should be earlier than 20/01/2024)
                expected_date = "2024-01-15"  # 15/01/2024 converted
                if petr4.get('purchase_date') == expected_date:
                    print(f"     ✅ Earliest date kept: {expected_date}")
                else:
                    print(f"     ❌ Earliest date not kept. Got: {petr4.get('purchase_date')}, expected: {expected_date}")
            else:
                print(f"   ❌ Expected 1 PETR4 stock, found {len(petr4_stocks)}")
                
        else:
            print(f"   ❌ Failed to get stocks: {response.status_code} - {response.text}")
            return False
            
    finally:
        # Clean up
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
    
    return True

if __name__ == "__main__":
    test_csv_import_with_dates()