#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Medical Contacts API with Authentication
Tests all authentication, subscription, and patient management endpoints
"""

import requests
import json
import sys
from datetime import datetime
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8000')
API_BASE = f"{BACKEND_URL}/api"

class MedicalContactsAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.demo_user_token = None
        self.test_user_id = None
        self.test_patient_id = None
        self.results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def log_result(self, test_name, success, message="", response=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if not success and response:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results['passed'] += 1
        else:
            self.results['failed'] += 1
            self.results['errors'].append(f"{test_name}: {message}")
        print()
    
    def test_health_check(self):
        """Test API health check"""
        try:
            response = self.session.get(f"{API_BASE}/")
            success = response.status_code == 200 and "Medical Contacts API" in response.text
            self.log_result("Health Check", success, 
                          f"Status: {response.status_code}, Response: {response.json()}" if success else "API not responding correctly",
                          response)
            return success
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        try:
            user_data = {
                "email": f"test.doctor.{datetime.now().timestamp()}@clinic.com",
                "password": "testpassword123",
                "full_name": "Dr. Test Doctor",
                "phone": "+1234567890",
                "medical_specialty": "general"
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            success = response.status_code == 201 # Expect 201 Created
            
            if success:
                data = response.json()
                if data.get('success') and data.get('access_token'):
                    self.auth_token = data['access_token']
                    self.test_user_id = data['user']['id']
                    self.log_result("User Registration", True, 
                                  f"User created with ID: {self.test_user_id}, Token received")
                else:
                    success = False
                    self.log_result("User Registration", False, "Missing success flag or access token", response)
            else:
                self.log_result("User Registration", False, "Registration failed", response)
            
            return success
        except Exception as e:
            self.log_result("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_demo_user_login(self):
        """Test login with demo user"""
        try:
            login_data = {
                "email": "dr.sarah@clinic.com",
                "password": "password123"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and data.get('access_token'):
                    self.demo_user_token = data['access_token']
                    self.log_result("Demo User Login", True, 
                                  f"Demo user logged in: {data['user']['full_name']}, Specialty: {data['user']['medical_specialty']}")
                else:
                    success = False
                    self.log_result("Demo User Login", False, "Missing success flag or access token", response)
            else:
                self.log_result("Demo User Login", False, "Login failed", response)
            
            return success
        except Exception as e:
            self.log_result("Demo User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test getting current user profile"""
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and data.get('user'):
                    user = data['user']
                    self.log_result("Get Current User", True, 
                                  f"User: {user['full_name']}, Email: {user['email']}, Specialty: {user['medical_specialty']}")
                else:
                    success = False
                    self.log_result("Get Current User", False, "Missing user data", response)
            else:
                self.log_result("Get Current User", False, "Failed to get user profile", response)
            
            return success
        except Exception as e:
            self.log_result("Get Current User", False, f"Exception: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test that endpoints require authentication"""
        try:
            # Test without token
            response = self.session.get(f"{API_BASE}/patients")
            success = response.status_code == 403 or response.status_code == 401
            
            if success:
                self.log_result("Unauthorized Access Protection", True,
                              f"Correctly blocked unauthorized access with status {response.status_code}")
            else:
                self.log_result("Unauthorized Access Protection", False,
                              f"Should have blocked access but got status {response.status_code}", response)
            
            return success
        except Exception as e:
            self.log_result("Unauthorized Access Protection", False, f"Exception: {str(e)}")
            return False

    def test_pro_feature_access(self):
        """Test access to the pro-only endpoint"""
        if not self.auth_token:
            self.log_result("Pro Feature Access", False, "No auth token for trial user available")
            return False

        try:
            # 1. Test that the trial user (the default registered user) gets a 403 Forbidden
            headers_trial = {"Authorization": f"Bearer {self.auth_token}"}
            response_trial = self.session.get(f"{API_BASE}/patients/pro-feature/", headers=headers_trial)
            success_trial = response_trial.status_code == 403
            self.log_result("Pro Feature Access (Trial User)", success_trial,
                          f"Trial user correctly blocked with status {response_trial.status_code}" if success_trial else f"Trial user should be blocked, but got {response_trial.status_code}",
                          response_trial)

            # 2. Create and log in a PRO user
            pro_user_data = {
                "email": f"pro.doctor.{datetime.now().timestamp()}@clinic.com",
                "password": "propassword123",
                "full_name": "Dr. Pro User",
                "plan": "pro"
            }

            pro_user_reg_response = self.session.post(f"{API_BASE}/auth/register", json=pro_user_data)
            if pro_user_reg_response.status_code != 201:
                 self.log_result("Pro Feature Access (Pro User Registration)", False, "Failed to register pro user for test", pro_user_reg_response)
                 return False

            pro_user_token = pro_user_reg_response.json()['access_token']

            # 3. Test that the pro user gets a 200 OK
            headers_pro = {"Authorization": f"Bearer {pro_user_token}"}
            response_pro = self.session.get(f"{API_BASE}/patients/pro-feature/", headers=headers_pro)
            success_pro = response_pro.status_code == 200
            self.log_result("Pro Feature Access (Pro User)", success_pro,
                          f"Pro user correctly allowed with status {response_pro.status_code}" if success_pro else f"Pro user should be allowed, but got {response_pro.status_code}",
                          response_pro)

            return success_trial and success_pro

        except Exception as e:
            self.log_result("Pro Feature Access", False, f"Exception: {str(e)}")
            return False
    
    def save_results_to_file(self, filename="test_result.md"):
        """Save test results to a Markdown file"""
        with open(filename, 'w') as f:
            f.write("# API Test Results\n\n")
            f.write(f"**Timestamp:** {datetime.now().isoformat()}\n")
            f.write(f"**Backend URL:** {API_BASE}\n\n")
            f.write("## Summary\n")
            f.write(f"- **✅ PASSED:** {self.results['passed']}\n")
            f.write(f"- **❌ FAILED:** {self.results['failed']}\n")
            f.write(f"- **📊 TOTAL:** {self.results['passed'] + self.results['failed']}\n\n")
            
            if self.results['failed'] > 0:
                f.write("## 🚨 Failed Tests\n")
                for error in self.results['errors']:
                    f.write(f"- {error}\n")
    
    def test_demo_patients_loaded(self):
        """Test that demo patients are loaded for demo user"""
        if not self.demo_user_token:
            self.log_result("Demo Patients Loaded", False, "No demo user token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            response = self.session.get(f"{API_BASE}/patients", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and data.get('patients'):
                    patients = data['patients']
                    patient_count = len(patients)
                    if patient_count >= 5:  # Should have 5 demo patients
                        # Check for specific demo patients
                        patient_names = [p['name'] for p in patients]
                        expected_names = ['John Wilson', 'Emma Rodriguez', 'Robert Chang', 'Lisa Thompson', 'David Miller']
                        found_names = [name for name in expected_names if name in patient_names]
                        
                        self.log_result("Demo Patients Loaded", True, 
                                      f"Found {patient_count} patients including: {', '.join(found_names[:3])}")
                    else:
                        success = False
                        self.log_result("Demo Patients Loaded", False, 
                                      f"Expected 5+ demo patients, found {patient_count}", response)
                else:
                    success = False
                    self.log_result("Demo Patients Loaded", False, "No patients data returned", response)
            else:
                self.log_result("Demo Patients Loaded", False, "Failed to get patients", response)
            
            return success
        except Exception as e:
            self.log_result("Demo Patients Loaded", False, f"Exception: {str(e)}")
            return False
    
    def test_create_patient(self):
        """Test creating a new patient"""
        if not self.auth_token:
            self.log_result("Create Patient", False, "No auth token available")
            return False
        
        try:
            patient_data = {
                "name": "Test Patient Johnson",
                "phone": "+1555999888",
                "email": "test.patient@email.com",
                "address": "123 Test Street, Test City",
                "location": "Clinic Room 5",
                "initial_complaint": "Test complaint for automated testing",
                "initial_diagnosis": "Test diagnosis - automated test case",
                "group": "test_group",
                "is_favorite": True
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(f"{API_BASE}/patients", json=patient_data, headers=headers)
            success = response.status_code == 201 # Expect 201 Created
            
            if success:
                data = response.json()
                if data.get('success') and data.get('patient'):
                    patient = data['patient']
                    self.test_patient_id = patient['id']
                    self.log_result("Create Patient", True, 
                                  f"Created patient: {patient['name']}, ID: {patient['patient_id']}")
                else:
                    success = False
                    self.log_result("Create Patient", False, "Missing patient data in response", response)
            else:
                self.log_result("Create Patient", False, "Failed to create patient", response)
            
            return success
        except Exception as e:
            self.log_result("Create Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_get_patients(self):
        """Test getting patients list"""
        if not self.auth_token:
            self.log_result("Get Patients", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/patients", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and 'patients' in data:
                    patients = data['patients']
                    self.log_result("Get Patients", True, 
                                  f"Retrieved {len(patients)} patients for current user")
                else:
                    success = False
                    self.log_result("Get Patients", False, "Missing patients data", response)
            else:
                self.log_result("Get Patients", False, "Failed to get patients", response)
            
            return success
        except Exception as e:
            self.log_result("Get Patients", False, f"Exception: {str(e)}")
            return False
    
    def test_search_patients(self):
        """Test patient search functionality"""
        if not self.demo_user_token:
            self.log_result("Search Patients", False, "No demo user token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            
            # Test search by name
            response = self.session.get(f"{API_BASE}/patients?search=John", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and data.get('patients'):
                    patients = data['patients']
                    found_john = any('John' in p['name'] for p in patients)
                    if found_john:
                        self.log_result("Search Patients", True, 
                                      f"Search by name 'John' found {len(patients)} patients")
                    else:
                        success = False
                        self.log_result("Search Patients", False, "Search didn't find expected patient 'John'", response)
                else:
                    success = False
                    self.log_result("Search Patients", False, "Search returned no data", response)
            else:
                self.log_result("Search Patients", False, "Search request failed", response)
            
            return success
        except Exception as e:
            self.log_result("Search Patients", False, f"Exception: {str(e)}")
            return False
    
    def test_update_patient(self):
        """Test updating a patient"""
        if not self.auth_token or not self.test_patient_id:
            self.log_result("Update Patient", False, "No auth token or patient ID available")
            return False
        
        try:
            update_data = {
                "initial_diagnosis": "Updated diagnosis - test completed successfully",
                "is_favorite": False
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.put(f"{API_BASE}/patients/{self.test_patient_id}", 
                                      json=update_data, headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and data.get('patient'):
                    patient = data['patient']
                    self.log_result("Update Patient", True, 
                                  f"Updated patient: {patient['name']}, New diagnosis: {patient['initial_diagnosis']}")
                else:
                    success = False
                    self.log_result("Update Patient", False, "Missing updated patient data", response)
            else:
                self.log_result("Update Patient", False, "Failed to update patient", response)
            
            return success
        except Exception as e:
            self.log_result("Update Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_add_patient_note(self):
        """Test adding a note to a patient"""
        if not self.auth_token or not self.test_patient_id:
            self.log_result("Add Patient Note", False, "No auth token or patient ID available")
            return False
        
        try:
            note_data = {
                "content": "Test note added during automated testing - patient responded well to treatment",
                "visit_type": "follow-up"
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(f"{API_BASE}/patients/{self.test_patient_id}/notes", 
                                       json=note_data, headers=headers)
            success = response.status_code == 201 # Expect 201 Created
            
            if success:
                data = response.json()
                if data.get('success') and data.get('note'):
                    note = data['note']
                    self.log_result("Add Patient Note", True, 
                                  f"Added note: {note['content'][:50]}..., Visit type: {note['visit_type']}")
                else:
                    success = False
                    self.log_result("Add Patient Note", False, "Missing note data in response", response)
            else:
                self.log_result("Add Patient Note", False, "Failed to add patient note", response)
            
            return success
        except Exception as e:
            self.log_result("Add Patient Note", False, f"Exception: {str(e)}")
            return False
    
    def test_get_patient_notes(self):
        """Test getting patient notes"""
        if not self.auth_token or not self.test_patient_id:
            self.log_result("Get Patient Notes", False, "No auth token or patient ID available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/patients/{self.test_patient_id}/notes", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and 'notes' in data:
                    notes = data['notes']
                    self.log_result("Get Patient Notes", True, 
                                  f"Retrieved {len(notes)} notes for patient")
                else:
                    success = False
                    self.log_result("Get Patient Notes", False, "Missing notes data", response)
            else:
                self.log_result("Get Patient Notes", False, "Failed to get patient notes", response)
            
            return success
        except Exception as e:
            self.log_result("Get Patient Notes", False, f"Exception: {str(e)}")
            return False
    
    def test_get_groups(self):
        """Test getting patient groups"""
        if not self.demo_user_token:
            self.log_result("Get Groups", False, "No demo user token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            response = self.session.get(f"{API_BASE}/patients/groups/", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and 'groups' in data:
                    groups = data['groups']
                    if len(groups) > 0:
                         self.log_result("Get Groups", True,
                                      f"Retrieved {len(groups)} groups: {', '.join(groups[:5])}")
                    else:
                        success = False
                        self.log_result("Get Groups", False, "No groups found in response", response)
                else:
                    success = False
                    self.log_result("Get Groups", False, "Missing groups data in response", response)
            else:
                self.log_result("Get Groups", False, f"Failed to get groups. Status: {response.status_code}", response)
            
            return success
        except Exception as e:
            self.log_result("Get Groups", False, f"Exception: {str(e)}")
            return False
    
    def test_get_statistics(self):
        """Test getting user statistics"""
        if not self.demo_user_token:
            self.log_result("Get Statistics", False, "No demo user token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            response = self.session.get(f"{API_BASE}/patients/stats/", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and data.get('stats'):
                    stats = data['stats']
                    if stats.get('total_patients', 0) > 0:
                        self.log_result("Get Statistics", True,
                                      f"Total patients: {stats.get('total_patients')}, Favorites: {stats.get('favorite_patients')}")
                    else:
                        success = False
                        self.log_result("Get Statistics", False, "Statistics are empty", response)
                else:
                    success = False
                    self.log_result("Get Statistics", False, "Missing stats data in response", response)
            else:
                self.log_result("Get Statistics", False, f"Failed to get statistics. Status: {response.status_code}", response)
            
            return success
        except Exception as e:
            self.log_result("Get Statistics", False, f"Exception: {str(e)}")
            return False
    
    def test_user_data_isolation(self):
        """Test that users can only see their own patients"""
        if not self.auth_token or not self.demo_user_token:
            self.log_result("User Data Isolation", False, "Missing auth tokens")
            return False
        
        try:
            # Get patients for test user (should be 1 - the one we created)
            headers1 = {"Authorization": f"Bearer {self.auth_token}"}
            response1 = self.session.get(f"{API_BASE}/patients", headers=headers1)
            
            # Get patients for demo user (should be 5 demo patients)
            headers2 = {"Authorization": f"Bearer {self.demo_user_token}"}
            response2 = self.session.get(f"{API_BASE}/patients", headers=headers2)
            
            success = response1.status_code == 200 and response2.status_code == 200
            
            if success:
                data1 = response1.json()
                data2 = response2.json()
                
                if data1.get('success') and data2.get('success'):
                    patients1 = data1['patients']
                    patients2 = data2['patients']
                    
                    # Check that patient lists are different and don't overlap
                    patient_ids1 = set(p['id'] for p in patients1)
                    patient_ids2 = set(p['id'] for p in patients2)
                    overlap = patient_ids1.intersection(patient_ids2)
                    
                    if len(overlap) == 0:
                        self.log_result("User Data Isolation", True, 
                                      f"Test user has {len(patients1)} patients, Demo user has {len(patients2)} patients, No overlap")
                    else:
                        success = False
                        self.log_result("User Data Isolation", False, 
                                      f"Found {len(overlap)} overlapping patients - data isolation failed")
                else:
                    success = False
                    self.log_result("User Data Isolation", False, "Failed to get patient data for comparison")
            else:
                self.log_result("User Data Isolation", False, "Failed to retrieve patients for both users")
            
            return success
        except Exception as e:
            self.log_result("User Data Isolation", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_patient(self):
        """Test deleting a patient (cleanup)"""
        if not self.auth_token or not self.test_patient_id:
            self.log_result("Delete Patient", False, "No auth token or patient ID available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.delete(f"{API_BASE}/patients/{self.test_patient_id}", headers=headers)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success'):
                    self.log_result("Delete Patient", True, 
                                  f"Successfully deleted test patient: {data.get('message')}")
                else:
                    success = False
                    self.log_result("Delete Patient", False, "Delete operation failed", response)
            else:
                self.log_result("Delete Patient", False, "Failed to delete patient", response)
            
            return success
        except Exception as e:
            self.log_result("Delete Patient", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("MEDICAL CONTACTS API COMPREHENSIVE TESTING")
        print("=" * 80)
        print(f"Testing API at: {API_BASE}")
        print()
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("Demo User Login", self.test_demo_user_login),
            ("Get Current User", self.test_get_current_user),
            ("Unauthorized Access Protection", self.test_unauthorized_access),
            ("Pro Feature Access", self.test_pro_feature_access),
            ("Demo Patients Loaded", self.test_demo_patients_loaded),
            ("Create Patient", self.test_create_patient),
            ("Get Patients", self.test_get_patients),
            ("Search Patients", self.test_search_patients),
            ("Update Patient", self.test_update_patient),
            ("Add Patient Note", self.test_add_patient_note),
            ("Get Patient Notes", self.test_get_patient_notes),
            ("Get Groups", self.test_get_groups),
            ("Get Statistics", self.test_get_statistics),
            ("User Data Isolation", self.test_user_data_isolation),
            ("Delete Patient", self.test_delete_patient),
        ]
        
        for test_name, test_func in tests:
            test_func()
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"✅ PASSED: {self.results['passed']}")
        print(f"❌ FAILED: {self.results['failed']}")
        print(f"📊 TOTAL:  {self.results['passed'] + self.results['failed']}")
        
        if self.results['failed'] > 0:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        print("=" * 80)
        
        # Save results to file
        self.save_results_to_file()
        print(f"Results saved to test_result.md")

        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = MedicalContactsAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)