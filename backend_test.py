import requests
import sys
import json
from datetime import datetime

class StockFolioAPITester:
    def __init__(self, base_url="https://acoes-dashboard.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = "demo_session_token_123"  # Updated to use demo session token
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": None,
                "error": None
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response_data"] = response.json()
                except:
                    result["response_data"] = response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error"] = error_data
                    print(f"   Error: {error_data}")
                except:
                    result["error"] = response.text
                    print(f"   Error: {response.text}")

            self.test_results.append(result)
            return success, result.get("response_data", {})

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": None,
                "success": False,
                "response_data": None,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_api_health(self):
        """Test API health endpoint"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_stock_search(self, ticker="PETR4"):
        """Test stock search endpoint"""
        return self.run_test(f"Stock Search - {ticker}", "GET", f"stocks/search/{ticker}", 200)

    def test_portfolio_get_stocks(self):
        """Test getting portfolio stocks"""
        return self.run_test("Get Portfolio Stocks", "GET", "portfolio/stocks", 200)

    def test_portfolio_add_stock(self):
        """Test adding stock to portfolio"""
        stock_data = {
            "ticker": "PETR4",
            "name": "Petrobras PN",
            "quantity": 100,
            "average_price": 35.50,
            "sector": "Petróleo",
            "current_price": 38.50,
            "dividend_yield": 12.5
        }
        return self.run_test("Add Stock to Portfolio", "POST", "portfolio/stocks", 200, stock_data)

    def test_portfolio_summary(self):
        """Test portfolio summary"""
        return self.run_test("Get Portfolio Summary", "GET", "portfolio/summary", 200)

    def test_dividends_get(self):
        """Test getting dividends"""
        return self.run_test("Get Dividends", "GET", "dividends", 200)

    def test_dividends_add(self, stock_id):
        """Test adding dividend"""
        dividend_data = {
            "stock_id": stock_id,
            "ticker": "PETR4",
            "amount": 1.50,
            "payment_date": "2025-01-15",
            "type": "dividendo"
        }
        return self.run_test("Add Dividend", "POST", "dividends", 200, dividend_data)

    def test_valuation_calculate(self):
        """Test valuation calculation"""
        valuation_data = {
            "ticker": "PETR4",
            "current_price": 38.50,
            "dividend_per_share": 4.80,
            "dividend_growth_rate": 0.05,
            "discount_rate": 0.12,
            "desired_yield": 0.06
        }
        return self.run_test("Calculate Valuation", "POST", "valuation/calculate", 200, valuation_data)

    def test_auth_me(self):
        """Test auth/me endpoint"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

def main():
    print("🚀 Starting StockFolio API Tests")
    print("=" * 50)
    
    tester = StockFolioAPITester()
    
    # Test 1: API Health
    print("\n📋 Testing API Health...")
    tester.test_api_health()
    
    # Test 2: Stock Search
    print("\n📋 Testing Stock Search...")
    tester.test_stock_search("PETR4")
    tester.test_stock_search("VALE3")
    
    # Test 3: Authentication
    print("\n📋 Testing Authentication...")
    tester.test_auth_me()
    
    # Test 4: Portfolio Operations
    print("\n📋 Testing Portfolio Operations...")
    tester.test_portfolio_get_stocks()
    
    success, stock_response = tester.test_portfolio_add_stock()
    stock_id = None
    if success and stock_response:
        stock_id = stock_response.get("stock_id")
        print(f"   Created stock with ID: {stock_id}")
    
    tester.test_portfolio_summary()
    
    # Test 5: Dividends
    print("\n📋 Testing Dividends...")
    tester.test_dividends_get()
    
    if stock_id:
        tester.test_dividends_add(stock_id)
    else:
        print("⚠️  Skipping dividend test - no stock ID available")
    
    # Test 6: Valuation
    print("\n📋 Testing Valuation...")
    tester.test_valuation_calculate()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        
        # Print failed tests
        failed_tests = [t for t in tester.test_results if not t["success"]]
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['test_name']}: {test.get('error', 'Status code mismatch')}")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())