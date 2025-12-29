import requests
import sys
import json
from datetime import datetime

class StockFolioAPITester:
    def __init__(self, base_url="https://investhub-16.preview.emergentagent.com/api"):
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

    def test_dividends_sync(self):
        """Test dividend synchronization from Investidor10"""
        return self.run_test("Sync Dividends from Investidor10", "POST", "dividends/sync", 200)

    def test_dividends_summary(self):
        """Test dividends summary"""
        return self.run_test("Get Dividends Summary", "GET", "dividends/summary", 200)
    def test_dividends_sync_comprehensive(self):
        print("\n🔍 Testing Comprehensive Dividend Sync Flow...")
        
        # Step 1: Get current user stocks
        success, stocks_response = self.run_test("Get Portfolio Stocks for Sync", "GET", "portfolio/stocks", 200)
        if not success:
            print("❌ Failed to get portfolio stocks")
            return False
        
        initial_stocks = stocks_response if isinstance(stocks_response, list) else []
        print(f"   📊 Found {len(initial_stocks)} stocks in portfolio")
        
        # Step 2: Add PETR4 stock if not exists (with past purchase date)
        petr4_exists = any(stock.get('ticker') == 'PETR4' for stock in initial_stocks)
        if not petr4_exists:
            print("   📈 Adding PETR4 stock with past purchase date...")
            stock_data = {
                "ticker": "PETR4",
                "name": "Petrobras PN",
                "quantity": 100,
                "average_price": 35.50,
                "purchase_date": "2024-01-01",  # Past date to ensure eligibility
                "sector": "Petróleo",
                "current_price": 38.50,
                "dividend_yield": 12.5
            }
            success, add_response = self.run_test("Add PETR4 for Sync Test", "POST", "portfolio/stocks", 200, stock_data)
            if not success:
                print("❌ Failed to add PETR4 stock")
                return False
            print(f"   ✅ Added PETR4 with stock_id: {add_response.get('stock_id')}")
        else:
            print("   ✅ PETR4 already exists in portfolio")
        
        # Step 3: Get initial dividend count
        success, initial_dividends = self.run_test("Get Initial Dividends", "GET", "dividends", 200)
        if not success:
            print("❌ Failed to get initial dividends")
            return False
        
        initial_count = len(initial_dividends) if isinstance(initial_dividends, list) else 0
        print(f"   📊 Initial dividend count: {initial_count}")
        
        # Step 4: Call dividend sync
        print("   🔄 Calling dividend sync...")
        success, sync_response = self.run_test("Sync Dividends", "POST", "dividends/sync", 200)
        if not success:
            print("❌ Dividend sync failed")
            return False
        
        # Validate sync response structure
        expected_fields = ['synced', 'skipped', 'total_tickers', 'message']
        for field in expected_fields:
            if field not in sync_response:
                print(f"❌ Missing field '{field}' in sync response")
                return False
        
        synced_count = sync_response.get('synced', 0)
        skipped_count = sync_response.get('skipped', 0)
        total_tickers = sync_response.get('total_tickers', 0)
        
        print(f"   ✅ Sync completed: {synced_count} synced, {skipped_count} skipped, {total_tickers} tickers processed")
        
        # Step 5: Verify dividends were created
        success, final_dividends = self.run_test("Get Final Dividends", "GET", "dividends", 200)
        if not success:
            print("❌ Failed to get final dividends")
            return False
        
        final_count = len(final_dividends) if isinstance(final_dividends, list) else 0
        new_dividends = final_count - initial_count
        
        print(f"   📊 Final dividend count: {final_count} (added {new_dividends})")
        
        if new_dividends > 0:
            print("   ✅ New dividends were created")
            
            # Check if PETR4 dividends exist
            petr4_dividends = [d for d in final_dividends if d.get('ticker') == 'PETR4']
            print(f"   📊 PETR4 dividends found: {len(petr4_dividends)}")
            
            if petr4_dividends:
                # Validate dividend structure
                sample_dividend = petr4_dividends[0]
                required_fields = ['dividend_id', 'user_id', 'stock_id', 'ticker', 'amount', 'payment_date', 'type']
                for field in required_fields:
                    if field not in sample_dividend:
                        print(f"❌ Missing field '{field}' in dividend record")
                        return False
                print("   ✅ Dividend records have correct structure")
        else:
            print("   ⚠️  No new dividends created (might be duplicates or no eligible dividends)")
        
        # Step 6: Test duplicate prevention - call sync again
        print("   🔄 Testing duplicate prevention...")
        success, second_sync = self.run_test("Second Sync Call", "POST", "dividends/sync", 200)
        if not success:
            print("❌ Second sync call failed")
            return False
        
        second_synced = second_sync.get('synced', 0)
        second_skipped = second_sync.get('skipped', 0)
        
        print(f"   📊 Second sync: {second_synced} synced, {second_skipped} skipped")
        
        if second_synced == 0 and second_skipped > 0:
            print("   ✅ Duplicate prevention working correctly")
        elif second_synced > 0:
            print("   ⚠️  Some new dividends synced on second call (might be expected if new data)")
        
        # Step 7: Verify dividends summary
        success, summary_response = self.run_test("Get Dividends Summary", "GET", "dividends/summary", 200)
        if success and summary_response:
            total_amount = summary_response.get('total', 0)
            by_ticker = summary_response.get('by_ticker', [])
            by_month = summary_response.get('by_month', [])
            
            print(f"   📊 Total dividends amount: R${total_amount}")
            print(f"   📊 Tickers with dividends: {len(by_ticker)}")
            print(f"   📊 Months with dividends: {len(by_month)}")
            
            if total_amount > 0:
                print("   ✅ Dividends summary shows positive amounts")
            else:
                print("   ⚠️  No dividend amounts in summary")
        
        print("   ✅ Comprehensive dividend sync test completed")
        return True

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

    def test_portfolio_import_csv(self):
        """Test CSV import endpoint"""
        # Test with empty file to check endpoint availability
        return self.run_test("Portfolio CSV Import", "POST", "portfolio/import/csv", 400)

    def test_portfolio_export_csv(self):
        """Test CSV export endpoint"""
        return self.run_test("Portfolio CSV Export", "GET", "portfolio/export/csv", 200)

    def test_portfolio_refresh_prices(self):
        """Test refresh prices endpoint"""
        return self.run_test("Refresh Portfolio Prices", "POST", "portfolio/refresh-prices", 200)

    def test_portfolio_snapshot(self):
        """Test portfolio snapshot creation"""
        return self.run_test("Create Portfolio Snapshot", "POST", "portfolio/snapshot", 200)

    def test_portfolio_history(self):
        """Test portfolio history retrieval"""
        return self.run_test("Get Portfolio History", "GET", "portfolio/history", 200)

    def test_alerts_get(self):
        """Test get alerts endpoint"""
        return self.run_test("Get Alerts", "GET", "alerts", 200)

    def test_alerts_count(self):
        """Test get unread alerts count"""
        return self.run_test("Get Unread Alerts Count", "GET", "alerts/count", 200)

    def test_alerts_mark_read(self, alert_id="test_alert_123"):
        """Test mark alert as read"""
        return self.run_test("Mark Alert as Read", "PUT", f"alerts/{alert_id}/read", 404)  # 404 expected for non-existent alert

    def test_stock_search_with_source(self, ticker="PETR4"):
        """Test stock search with source field"""
        success, response = self.run_test(f"Stock Search with Source - {ticker}", "GET", f"stocks/search/{ticker}", 200)
        if success and response:
            if 'source' in response:
                print(f"   ✅ Source field present: {response['source']}")
            else:
                print(f"   ⚠️  Source field missing in response")
        return success, response

def main():
    print("🚀 Starting StockFolio API Tests - New Features")
    print("=" * 50)
    
    tester = StockFolioAPITester()
    
    # Test 1: API Health
    print("\n📋 Testing API Health...")
    tester.test_api_health()
    
    # Test 2: Stock Search with Source Field
    print("\n📋 Testing Stock Search with Source Field...")
    tester.test_stock_search_with_source("PETR4")
    tester.test_stock_search_with_source("VALE3")
    
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
    
    # Test 5: New Portfolio Features
    print("\n📋 Testing New Portfolio Features...")
    tester.test_portfolio_import_csv()
    tester.test_portfolio_export_csv()
    tester.test_portfolio_refresh_prices()
    tester.test_portfolio_snapshot()
    tester.test_portfolio_history()
    
    # Test 6: Alerts System
    print("\n📋 Testing Alerts System...")
    tester.test_alerts_get()
    tester.test_alerts_count()
    tester.test_alerts_mark_read()
    
    # Test 7: Dividends
    print("\n📋 Testing Dividends...")
    tester.test_dividends_get()
    
    if stock_id:
        tester.test_dividends_add(stock_id)
    else:
        print("⚠️  Skipping dividend test - no stock ID available")
    
    # Test dividend sync functionality
    print("\n📋 Testing Dividend Sync...")
    tester.test_dividends_sync()
    tester.test_dividends_summary()
    
    # Comprehensive dividend sync test
    print("\n📋 Running Comprehensive Dividend Sync Test...")
    tester.test_dividends_sync_comprehensive()
    
    # Test 8: Valuation
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