#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Medical Contacts App
Tests all patient management endpoints with realistic medical data
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://android-dev-studio-3.preview.emergentagent.com/api"

class MedicalContactsAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.created_patients = []  # Track created patients for cleanup
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_health_check(self) -> bool:
        """Test GET /api/ - Basic health check"""
        try:
            response = self.session.get(f"{self.base_url}/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "message" in data and "Medical Contacts API" in data["message"]
                self.log_test("Health Check", success, f"Response: {data}")
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}, Response: {response.text}")
                
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_create_patient(self) -> Optional[Dict]:
        """Test POST /api/patients - Create new patient with medical fields"""
        patient_data = {
            "name": "Dr. Sarah Johnson",
            "phone": "+1-555-0123",
            "email": "sarah.johnson@email.com",
            "address": "456 Oak Avenue, Medical District, NY 10001",
            "location": "Cardiology Wing - Room 302",
            "initial_complaint": "Chest pain and shortness of breath during exercise",
            "initial_diagnosis": "Possible angina, requires stress test and ECG",
            "group": "cardiology",
            "is_favorite": False
        }
        
        try:
            response = self.session.post(f"{self.base_url}/patients", json=patient_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "patient" in data
                
                if success:
                    patient = data["patient"]
                    # Verify auto-increment patient ID format
                    patient_id_valid = patient.get("patient_id", "").startswith("PAT")
                    success = success and patient_id_valid
                    
                    if success:
                        self.created_patients.append(patient["id"])
                        self.log_test("Create Patient", True, 
                                    f"Created patient {patient['patient_id']} - {patient['name']}")
                        return patient
                    else:
                        self.log_test("Create Patient", False, "Invalid patient_id format")
                else:
                    self.log_test("Create Patient", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Create Patient", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Create Patient", False, f"Exception: {str(e)}")
            
        return None
    
    def test_create_multiple_patients(self) -> List[Dict]:
        """Create multiple patients to test auto-increment and search functionality"""
        patients_data = [
            {
                "name": "Michael Rodriguez",
                "phone": "+1-555-0124",
                "email": "m.rodriguez@email.com",
                "address": "789 Pine Street, Downtown, NY 10002",
                "location": "Orthopedic Clinic - Room 105",
                "initial_complaint": "Lower back pain after lifting heavy objects",
                "initial_diagnosis": "Lumbar strain, recommend physical therapy",
                "group": "orthopedics",
                "is_favorite": True
            },
            {
                "name": "Emily Chen",
                "phone": "+1-555-0125",
                "email": "emily.chen@email.com",
                "address": "321 Maple Drive, Suburbs, NY 10003",
                "location": "Pediatrics Department - Room 201",
                "initial_complaint": "Persistent cough and fever in 8-year-old",
                "initial_diagnosis": "Upper respiratory infection, prescribed antibiotics",
                "group": "pediatrics",
                "is_favorite": False
            },
            {
                "name": "Robert Thompson",
                "phone": "+1-555-0126",
                "email": "r.thompson@email.com",
                "address": "654 Elm Street, Uptown, NY 10004",
                "location": "Dermatology Suite - Room 401",
                "initial_complaint": "Suspicious mole on left shoulder",
                "initial_diagnosis": "Atypical nevus, biopsy scheduled",
                "group": "dermatology",
                "is_favorite": True
            }
        ]
        
        created_patients = []
        for patient_data in patients_data:
            try:
                response = self.session.post(f"{self.base_url}/patients", json=patient_data)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "patient" in data:
                        patient = data["patient"]
                        created_patients.append(patient)
                        self.created_patients.append(patient["id"])
                        
            except Exception as e:
                print(f"Failed to create patient {patient_data['name']}: {str(e)}")
        
        self.log_test("Create Multiple Patients", len(created_patients) == len(patients_data),
                     f"Created {len(created_patients)}/{len(patients_data)} patients")
        return created_patients
    
    def test_get_all_patients(self) -> bool:
        """Test GET /api/patients - List all patients"""
        try:
            response = self.session.get(f"{self.base_url}/patients")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "patients" in data
                
                if success:
                    patients = data["patients"]
                    self.log_test("Get All Patients", True, f"Retrieved {len(patients)} patients")
                else:
                    self.log_test("Get All Patients", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Get All Patients", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Get All Patients", False, f"Exception: {str(e)}")
            return False
    
    def test_search_functionality(self) -> bool:
        """Test GET /api/patients with search parameters"""
        test_cases = [
            ("name search", {"search": "Sarah"}),
            ("phone search", {"search": "555-0123"}),
            ("email search", {"search": "sarah.johnson"}),
            ("patient_id search", {"search": "PAT"}),
            ("group filter", {"group": "cardiology"}),
            ("favorites only", {"favorites_only": True}),
            ("combined filters", {"group": "orthopedics", "favorites_only": True})
        ]
        
        all_passed = True
        for test_name, params in test_cases:
            try:
                response = self.session.get(f"{self.base_url}/patients", params=params)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    success = data.get("success", False) and "patients" in data
                    
                if success:
                    patients = data["patients"]
                    self.log_test(f"Search - {test_name}", True, f"Found {len(patients)} patients")
                else:
                    self.log_test(f"Search - {test_name}", False, f"Status: {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Search - {test_name}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_get_specific_patient(self, patient_id: str) -> bool:
        """Test GET /api/patients/{patient_id} - Get specific patient details"""
        try:
            response = self.session.get(f"{self.base_url}/patients/{patient_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "patient" in data
                
                if success:
                    patient = data["patient"]
                    self.log_test("Get Specific Patient", True, 
                                f"Retrieved patient: {patient.get('name', 'Unknown')}")
                else:
                    self.log_test("Get Specific Patient", False, f"Invalid response: {data}")
            else:
                self.log_test("Get Specific Patient", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Get Specific Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_update_patient(self, patient_id: str) -> bool:
        """Test PUT /api/patients/{patient_id} - Update patient information"""
        update_data = {
            "location": "Cardiology Wing - Room 305 (Updated)",
            "initial_diagnosis": "Confirmed angina, medication prescribed",
            "is_favorite": True
        }
        
        try:
            response = self.session.put(f"{self.base_url}/patients/{patient_id}", json=update_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "patient" in data
                
                if success:
                    patient = data["patient"]
                    # Verify updates were applied
                    location_updated = patient.get("location") == update_data["location"]
                    diagnosis_updated = patient.get("initial_diagnosis") == update_data["initial_diagnosis"]
                    favorite_updated = patient.get("is_favorite") == update_data["is_favorite"]
                    
                    success = location_updated and diagnosis_updated and favorite_updated
                    self.log_test("Update Patient", success, 
                                f"Updated patient: {patient.get('name', 'Unknown')}")
                else:
                    self.log_test("Update Patient", False, f"Invalid response: {data}")
            else:
                self.log_test("Update Patient", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Update Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_add_patient_note(self, patient_id: str) -> bool:
        """Test POST /api/patients/{patient_id}/notes - Add timestamped notes"""
        note_data = {
            "content": "Patient responded well to initial treatment. Blood pressure normalized. Recommended lifestyle changes including regular exercise and dietary modifications. Schedule follow-up in 2 weeks.",
            "visit_type": "follow-up"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/patients/{patient_id}/notes", json=note_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "note" in data
                
                if success:
                    note = data["note"]
                    # Verify note has required fields
                    has_id = "id" in note
                    has_timestamp = "timestamp" in note
                    has_content = note.get("content") == note_data["content"]
                    has_visit_type = note.get("visit_type") == note_data["visit_type"]
                    
                    success = has_id and has_timestamp and has_content and has_visit_type
                    self.log_test("Add Patient Note", success, f"Added note with ID: {note.get('id', 'Unknown')}")
                else:
                    self.log_test("Add Patient Note", False, f"Invalid response: {data}")
            else:
                self.log_test("Add Patient Note", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Add Patient Note", False, f"Exception: {str(e)}")
            return False
    
    def test_get_patient_notes(self, patient_id: str) -> bool:
        """Test GET /api/patients/{patient_id}/notes - Get patient notes history"""
        try:
            response = self.session.get(f"{self.base_url}/patients/{patient_id}/notes")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "notes" in data
                
                if success:
                    notes = data["notes"]
                    self.log_test("Get Patient Notes", True, f"Retrieved {len(notes)} notes")
                    
                    # Verify notes are sorted by timestamp (newest first)
                    if len(notes) > 1:
                        timestamps = [note.get("timestamp") for note in notes if "timestamp" in note]
                        sorted_correctly = timestamps == sorted(timestamps, reverse=True)
                        if not sorted_correctly:
                            self.log_test("Notes Sorting", False, "Notes not sorted by timestamp")
                            return False
                else:
                    self.log_test("Get Patient Notes", False, f"Invalid response: {data}")
            else:
                self.log_test("Get Patient Notes", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Get Patient Notes", False, f"Exception: {str(e)}")
            return False
    
    def test_get_groups(self) -> bool:
        """Test GET /api/groups - Get patient groups/categories"""
        try:
            response = self.session.get(f"{self.base_url}/groups")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "groups" in data
                
                if success:
                    groups = data["groups"]
                    expected_groups = ["cardiology", "orthopedics", "pediatrics", "dermatology"]
                    found_groups = [g for g in expected_groups if g in groups]
                    
                    self.log_test("Get Groups", True, f"Retrieved groups: {groups}")
                    if len(found_groups) < len(expected_groups):
                        print(f"   Note: Expected groups {expected_groups}, found {found_groups}")
                else:
                    self.log_test("Get Groups", False, f"Invalid response: {data}")
            else:
                self.log_test("Get Groups", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Get Groups", False, f"Exception: {str(e)}")
            return False
    
    def test_get_statistics(self) -> bool:
        """Test GET /api/stats - Get statistics"""
        try:
            response = self.session.get(f"{self.base_url}/stats")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "stats" in data
                
                if success:
                    stats = data["stats"]
                    has_total = "total_patients" in stats
                    has_favorites = "favorite_patients" in stats
                    has_groups = "groups" in stats
                    
                    success = has_total and has_favorites and has_groups
                    
                    if success:
                        self.log_test("Get Statistics", True, 
                                    f"Total: {stats['total_patients']}, Favorites: {stats['favorite_patients']}")
                    else:
                        self.log_test("Get Statistics", False, "Missing required stats fields")
                else:
                    self.log_test("Get Statistics", False, f"Invalid response: {data}")
            else:
                self.log_test("Get Statistics", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Get Statistics", False, f"Exception: {str(e)}")
            return False
    
    def test_error_handling(self) -> bool:
        """Test error handling for invalid requests"""
        test_cases = [
            ("Get non-existent patient", "GET", f"{self.base_url}/patients/invalid-id", None, 404),
            ("Update non-existent patient", "PUT", f"{self.base_url}/patients/invalid-id", {"name": "Test"}, 404),
            ("Delete non-existent patient", "DELETE", f"{self.base_url}/patients/invalid-id", None, 404),
            ("Add note to non-existent patient", "POST", f"{self.base_url}/patients/invalid-id/notes", 
             {"content": "Test note"}, 404),
            ("Get notes for non-existent patient", "GET", f"{self.base_url}/patients/invalid-id/notes", None, 404)
        ]
        
        all_passed = True
        for test_name, method, url, data, expected_status in test_cases:
            try:
                if method == "GET":
                    response = self.session.get(url)
                elif method == "POST":
                    response = self.session.post(url, json=data)
                elif method == "PUT":
                    response = self.session.put(url, json=data)
                elif method == "DELETE":
                    response = self.session.delete(url)
                
                success = response.status_code == expected_status
                self.log_test(f"Error Handling - {test_name}", success, 
                            f"Expected {expected_status}, got {response.status_code}")
                
                if not success:
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Error Handling - {test_name}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_delete_patient(self, patient_id: str) -> bool:
        """Test DELETE /api/patients/{patient_id} - Delete patient"""
        try:
            response = self.session.delete(f"{self.base_url}/patients/{patient_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "message" in data
                
                if success:
                    self.log_test("Delete Patient", True, f"Deleted patient: {patient_id}")
                    # Remove from tracking list
                    if patient_id in self.created_patients:
                        self.created_patients.remove(patient_id)
                else:
                    self.log_test("Delete Patient", False, f"Invalid response: {data}")
            else:
                self.log_test("Delete Patient", False, f"Status: {response.status_code}")
                
            return success
        except Exception as e:
            self.log_test("Delete Patient", False, f"Exception: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up any remaining test patients"""
        print("\n🧹 Cleaning up test data...")
        for patient_id in self.created_patients.copy():
            try:
                response = self.session.delete(f"{self.base_url}/patients/{patient_id}")
                if response.status_code == 200:
                    print(f"   Deleted patient: {patient_id}")
                    self.created_patients.remove(patient_id)
            except Exception as e:
                print(f"   Failed to delete patient {patient_id}: {str(e)}")
    
    def run_comprehensive_tests(self):
        """Run all backend API tests"""
        print("🏥 Medical Contacts Backend API Testing")
        print("=" * 50)
        print(f"Testing backend at: {self.base_url}")
        print()
        
        test_results = []
        
        # 1. Health Check
        test_results.append(("Health Check", self.test_health_check()))
        
        # 2. Create initial patient
        patient = self.test_create_patient()
        test_results.append(("Create Patient", patient is not None))
        
        if patient:
            patient_id = patient["id"]
            
            # 3. Create multiple patients for comprehensive testing
            additional_patients = self.test_create_multiple_patients()
            test_results.append(("Create Multiple Patients", len(additional_patients) > 0))
            
            # 4. Get all patients
            test_results.append(("Get All Patients", self.test_get_all_patients()))
            
            # 5. Search functionality
            test_results.append(("Search Functionality", self.test_search_functionality()))
            
            # 6. Get specific patient
            test_results.append(("Get Specific Patient", self.test_get_specific_patient(patient_id)))
            
            # 7. Update patient
            test_results.append(("Update Patient", self.test_update_patient(patient_id)))
            
            # 8. Add patient note
            test_results.append(("Add Patient Note", self.test_add_patient_note(patient_id)))
            
            # 9. Get patient notes
            test_results.append(("Get Patient Notes", self.test_get_patient_notes(patient_id)))
            
            # 10. Get groups
            test_results.append(("Get Groups", self.test_get_groups()))
            
            # 11. Get statistics
            test_results.append(("Get Statistics", self.test_get_statistics()))
            
            # 12. Error handling
            test_results.append(("Error Handling", self.test_error_handling()))
            
            # 13. Delete patient (test one patient)
            if additional_patients:
                test_patient_id = additional_patients[0]["id"]
                test_results.append(("Delete Patient", self.test_delete_patient(test_patient_id)))
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n📊 Test Results Summary")
        print("=" * 30)
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! Backend API is working correctly.")
        else:
            print("⚠️  Some tests failed. Please check the detailed output above.")
        
        return passed == total

def main():
    """Main test execution"""
    tester = MedicalContactsAPITester()
    success = tester.run_comprehensive_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())