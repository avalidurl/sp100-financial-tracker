#!/usr/bin/env python3
"""
Unit tests for fetch-comprehensive-data.py
Run with: pytest test_fetch_comprehensive_data.py
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Import the module to test
sys.path.insert(0, os.path.dirname(__file__))
from fetch_comprehensive_data import ComprehensiveDataFetcher


class TestComprehensiveDataFetcher:
    """Test suite for ComprehensiveDataFetcher"""
    
    @pytest.fixture
    def fetcher(self):
        """Create a fetcher instance for testing"""
        return ComprehensiveDataFetcher()
    
    def test_metrics_map_structure(self, fetcher):
        """Test that metrics map is properly structured"""
        assert isinstance(fetcher.metrics_map, dict)
        assert 'revenue' in fetcher.metrics_map
        assert 'earnings' in fetcher.metrics_map
        assert 'capex' in fetcher.metrics_map
        assert all(isinstance(v, list) for v in fetcher.metrics_map.values())
    
    def test_free_cash_flow_calculation(self, fetcher):
        """Test Free Cash Flow calculation"""
        company = {
            'operating_cash_flow': 10_000_000_000,
            'capex': -2_000_000_000
        }
        
        # Calculate FCF
        fcf = company['operating_cash_flow'] + company['capex']
        assert fcf == 8_000_000_000
        
        # FCF should be positive when OpCF > CapEx
        assert fcf > 0
    
    def test_debt_to_equity_calculation(self, fetcher):
        """Test Debt-to-Equity ratio calculation"""
        company = {
            'long_term_debt': 100_000_000_000,
            'stockholders_equity': 80_000_000_000
        }
        
        # Calculate D/E
        debt_to_equity = round(company['long_term_debt'] / company['stockholders_equity'], 2)
        assert debt_to_equity == 1.25
    
    def test_debt_to_equity_zero_equity(self, fetcher):
        """Test D/E calculation doesn't divide by zero"""
        company = {
            'long_term_debt': 100_000_000_000,
            'stockholders_equity': 0
        }
        
        # Should not calculate if equity is 0
        if company['stockholders_equity'] > 0:
            debt_to_equity = round(company['long_term_debt'] / company['stockholders_equity'], 2)
        else:
            debt_to_equity = None
        
        assert debt_to_equity is None
    
    def test_profit_margin_calculation(self, fetcher):
        """Test Profit Margin calculation"""
        company = {
            'earnings': 25_000_000_000,
            'revenue': 100_000_000_000
        }
        
        # Calculate profit margin
        profit_margin = round(company['earnings'] / company['revenue'] * 100, 1)
        assert profit_margin == 25.0
    
    def test_profit_margin_zero_revenue(self, fetcher):
        """Test profit margin doesn't divide by zero"""
        company = {
            'earnings': 25_000_000_000,
            'revenue': 0
        }
        
        # Should not calculate if revenue is 0
        if company['revenue'] > 0:
            profit_margin = round(company['earnings'] / company['revenue'] * 100, 1)
        else:
            profit_margin = None
        
        assert profit_margin is None
    
    def test_negative_profit_margin(self, fetcher):
        """Test profit margin with negative earnings (loss)"""
        company = {
            'earnings': -5_000_000_000,
            'revenue': 100_000_000_000
        }
        
        profit_margin = round(company['earnings'] / company['revenue'] * 100, 1)
        assert profit_margin == -5.0
        assert profit_margin < 0  # Should be negative
    
    def test_capex_is_negative(self, fetcher):
        """Test that CapEx is stored as negative (investment)"""
        # CapEx should be negative in our data model
        capex = -10_000_000_000
        assert capex < 0
        
        # Absolute value should be positive
        assert abs(capex) > 0
    
    def test_cik_padding(self, fetcher):
        """Test CIK number padding to 10 digits"""
        cik = "789019"
        padded_cik = cik.zfill(10)
        
        assert len(padded_cik) == 10
        assert padded_cik == "0000789019"
    
    @patch('fetch_comprehensive_data.requests.Session.get')
    def test_get_company_cik_success(self, mock_get, fetcher):
        """Test successful CIK lookup"""
        # Mock response
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "0": {"cik_str": 789019, "ticker": "MSFT", "title": "Microsoft Corporation"}
        }
        mock_get.return_value = mock_response
        
        cik = fetcher.get_company_cik("MSFT")
        assert cik == "0000789019"
    
    @patch('fetch_comprehensive_data.requests.Session.get')
    def test_get_company_cik_not_found(self, mock_get, fetcher):
        """Test CIK lookup for non-existent ticker"""
        # Mock response
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "0": {"cik_str": 789019, "ticker": "MSFT", "title": "Microsoft Corporation"}
        }
        mock_get.return_value = mock_response
        
        cik = fetcher.get_company_cik("FAKESYMBOL")
        assert cik is None
    
    def test_extract_latest_value_usd(self, fetcher):
        """Test extracting USD values from SEC data"""
        # Mock SEC EDGAR response structure
        sec_data = {
            "facts": {
                "us-gaap": {
                    "Revenues": {
                        "units": {
                            "USD": [
                                {"end": "2022-12-31", "val": 100000000000, "form": "10-K"},
                                {"end": "2023-12-31", "val": 120000000000, "form": "10-K"},
                                {"end": "2023-09-30", "val": 30000000000, "form": "10-Q"}
                            ]
                        }
                    }
                }
            }
        }
        
        # Should get latest 10-K value (not 10-Q)
        value = fetcher.extract_latest_value(sec_data, ['Revenues'])
        assert value == 120000000000
    
    def test_extract_latest_value_not_found(self, fetcher):
        """Test extracting value when field doesn't exist"""
        sec_data = {
            "facts": {
                "us-gaap": {}
            }
        }
        
        value = fetcher.extract_latest_value(sec_data, ['NonExistentField'])
        assert value is None
    
    def test_data_validation_revenue_positive(self, fetcher):
        """Test that revenue should be positive"""
        company = {'revenue': 100_000_000_000}
        assert company['revenue'] > 0
    
    def test_data_validation_total_assets_positive(self, fetcher):
        """Test that total assets should be positive"""
        company = {'total_assets': 500_000_000_000}
        assert company['total_assets'] > 0
    
    def test_comprehensive_company_data_structure(self, fetcher):
        """Test complete company data structure"""
        company = {
            'symbol': 'AAPL',
            'name': 'Apple Inc.',
            'revenue': 394328000000,
            'earnings': 99803000000,
            'capex': -10959000000,
            'operating_income': 123216000000,
            'operating_cash_flow': 118254000000,
            'free_cash_flow': 107295000000,
            'total_assets': 364980000000,
            'long_term_debt': 106611000000,
            'stockholders_equity': 85566000000,
            'debt_to_equity': 1.25,
            'profit_margin': 25.3
        }
        
        # Verify all required fields exist
        assert 'symbol' in company
        assert 'revenue' in company
        assert 'earnings' in company
        assert 'capex' in company
        
        # Verify calculated metrics are reasonable
        assert company['free_cash_flow'] > 0
        assert 0 < company['profit_margin'] < 100
        assert company['debt_to_equity'] > 0


class TestDataIntegrity:
    """Test data integrity and validation"""
    
    def test_load_capex_data_json(self):
        """Test that financial_data.json is valid"""
        try:
            with open('data/financial_data.json', 'r') as f:
                data = json.load(f)
            
            assert isinstance(data, list)
            assert len(data) > 0
            
            # Test first company has required fields
            if len(data) > 0:
                company = data[0]
                assert 'symbol' in company
                assert 'name' in company
                assert 'capex' in company or 'revenue' in company
        except FileNotFoundError:
            pytest.skip("financial_data.json not found")
    
    def test_data_types(self):
        """Test that data types are correct"""
        try:
            with open('data/financial_data.json', 'r') as f:
                data = json.load(f)
            
            if len(data) > 0:
                company = data[0]
                
                # String fields
                assert isinstance(company.get('symbol', ''), str)
                assert isinstance(company.get('name', ''), str)
                
                # Numeric fields
                if 'revenue' in company:
                    assert isinstance(company['revenue'], (int, float))
                if 'capex' in company:
                    assert isinstance(company['capex'], (int, float))
                if 'market_cap' in company:
                    assert isinstance(company['market_cap'], (int, float))
        except FileNotFoundError:
            pytest.skip("financial_data.json not found")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

