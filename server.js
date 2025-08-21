    <script>
        let allData = [];
        let filteredData = [];
        let charts = {};
        let currentUser = null;
        let selectedAgency = null;

        // User accounts database
        const users = {
            'admin': { 
                password: 'admin123', 
                role: 'admin', 
                name: 'Administrator',
                avatar: 'A',
                permissions: ['view', 'add', 'edit', 'delete', 'admin']
            },
            'viewer': { 
                password: 'view123', 
                role: 'viewer', 
                name: 'Data Viewer',
                avatar: 'V',
                permissions: ['view']
            },
            'reporter': { 
                password: 'report123', 
                role: 'reporter', 
                name: 'Case Reporter',
                avatar: 'R',
                permissions: ['add']
            }
        };

        // Color schemes
        const colors = {
            primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
            gradient: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)', 'rgba(240, 147, 251, 0.8)', 'rgba(245, 87, 108, 0.8)', 'rgba(79, 172, 254, 0.8)', 'rgba(0, 242, 254, 0.8)']
        };

        // Quick login function for demo accounts
        function quickLogin(username, password) {
            document.getElementById('username').value = username;
            document.getElementById('password').value = password;
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }

        // Authentication Functions
        function login(username, password) {
            const user = users[username];
            if (user && user.password === password) {
                currentUser = {
                    username: username,
                    ...user
                };
                
                // Save session
                localStorage.setItem('cvw_session', JSON.stringify(currentUser));
                
                // Update UI
                updateUserInterface();
                showDashboard();
                return true;
            }
            return false;
        }

        function logout() {
            currentUser = null;
            localStorage.removeItem('cvw_session');
            showLoginScreen();
        }

        function checkSession() {
            const session = localStorage.getItem('cvw_session');
            if (session) {
                try {
                    currentUser = JSON.parse(session);
                    updateUserInterface();
                    showDashboard();
                    return true;
                } catch (e) {
                    localStorage.removeItem('cvw_session');
                }
            }
            return false;
        }

        function hasPermission(permission) {
            return currentUser && currentUser.permissions.includes(permission);
        }

        function updateUserInterface() {
            if (!currentUser) return;

            // Update user info bar
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userRole').textContent = `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Account`;
            document.getElementById('userAvatar').textContent = currentUser.avatar;
            
            // Add role-based styling
            const userInfoBar = document.getElementById('userInfoBar');
            userInfoBar.className = `user-info-bar role-${currentUser.role}`;

            // Role-based visibility
            const role = currentUser.role;
            
            // Admin: Full access
            if (role === 'admin') {
                document.getElementById('addRecordBtn').classList.remove('hidden');
                document.getElementById('viewDashboardBtn').classList.remove('hidden');
                document.getElementById('clearDataBtn').classList.remove('hidden');
                document.getElementById('searchRecordsBtn').classList.remove('hidden');
                document.getElementById('filtersSection').classList.remove('hidden');
                document.getElementById('kpiSection').classList.remove('hidden');
                document.getElementById('chartsSection').classList.remove('hidden');
                document.getElementById('tableSection').classList.remove('hidden');
                document.getElementById('reporterOnlyContent').classList.add('hidden');
                document.getElementById('agencySelection').classList.remove('hidden');
            }
            // Viewer: Read-only access
            else if (role === 'viewer') {
                document.getElementById('addRecordBtn').classList.add('hidden');
                document.getElementById('viewDashboardBtn').classList.remove('hidden');
                document.getElementById('clearDataBtn').classList.add('hidden');
                document.getElementById('searchRecordsBtn').classList.remove('hidden');
                document.getElementById('filtersSection').classList.remove('hidden');
                document.getElementById('kpiSection').classList.remove('hidden');
                document.getElementById('chartsSection').classList.remove('hidden');
                document.getElementById('tableSection').classList.remove('hidden');
                document.getElementById('reporterOnlyContent').classList.add('hidden');
                document.getElementById('agencySelection').classList.add('hidden');
            }
            // Reporter: Add records only
            else if (role === 'reporter') {
                document.getElementById('addRecordBtn').classList.remove('hidden');
                document.getElementById('viewDashboardBtn').classList.add('hidden');
                document.getElementById('clearDataBtn').classList.add('hidden');
                document.getElementById('searchRecordsBtn').classList.remove('hidden');
                document.getElementById('filtersSection').classList.add('hidden');
                document.getElementById('kpiSection').classList.add('hidden');
                document.getElementById('chartsSection').classList.add('hidden');
                document.getElementById('tableSection').classList.add('hidden');
                document.getElementById('reporterOnlyContent').classList.remove('hidden');
                document.getElementById('agencySelection').classList.remove('hidden');
            }

            // Reset agency selection and button state
            selectedAgency = null;
            document.getElementById('addRecordBtn').disabled = true;
            document.querySelectorAll('.agency-btn').forEach(btn => btn.classList.remove('selected'));
        }

        function showLoginScreen() {
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('mainDashboard').classList.add('hidden');
        }

        function showDashboard() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainDashboard').classList.remove('hidden');
            
            // Initialize dashboard if admin or viewer
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'viewer')) {
                setTimeout(initializeDashboard, 100);
            }
        }

        // Agency selection function
        function selectAgency(agency) {
            selectedAgency = agency;
            
            // Update button states
            document.querySelectorAll('.agency-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.querySelector(`[data-agency="${agency}"]`).classList.add('selected');
            
            // Enable add record button
            document.getElementById('addRecordBtn').disabled = false;
            
            // Update button text to show selected agency
            const agencyNames = {
                'NPA': 'National Prosecution Authority',
                'MOH': 'Ministry of Health', 
                'ZP': 'Zambia Police'
            };
            document.getElementById('addRecordBtn').innerHTML = `➕ Add New Record (${agencyNames[agency]})`;
            
            console.log(`📋 Selected agency: ${agency} - ${agencyNames[agency]}`);
        }

        // Enhanced Age Handling Functions
        function setupAgeInputHandlers() {
            const ageInput = document.getElementById('cvwAge');
            const ageUnit = document.getElementById('ageUnit');
            
            if (ageInput && ageUnit) {
                ageUnit.addEventListener('change', function() {
                    const unit = this.value;
                    
                    if (unit === 'months') {
                        ageInput.max = '60'; // 5 years max in months
                        ageInput.placeholder = 'Enter months (0-60)';
                        ageInput.title = 'Enter age in months (0-60 months = 0-5 years)';
                        // Highlight for months input
                        ageInput.style.borderColor = '#dc2626';
                        ageInput.style.backgroundColor = '#fef2f2';
                    } else if (unit === 'years') {
                        ageInput.max = '18';
                        ageInput.placeholder = 'Enter years (0-18)';
                        ageInput.title = 'Enter age in years (0-18 years)';
                        // Reset styling for years
                        ageInput.style.borderColor = '#dee2e6';
                        ageInput.style.backgroundColor = 'white';
                    } else {
                        ageInput.max = '120';
                        ageInput.placeholder = 'Enter age';
                        ageInput.title = '';
                        ageInput.style.borderColor = '#dee2e6';
                        ageInput.style.backgroundColor = 'white';
                    }
                    
                    // Clear the input when unit changes
                    ageInput.value = '';
                });

                // Validate age input based on unit
                ageInput.addEventListener('input', function() {
                    const unit = ageUnit.value;
                    const value = parseFloat(this.value);
                    
                    if (unit === 'months' && value > 60) {
                        this.setCustomValidity('Maximum 60 months (5 years). Use "Years" for older children.');
                    } else if (unit === 'years' && value > 18) {
                        this.setCustomValidity('Maximum 18 years for CVW cases.');
                    } else if (value < 0) {
                        this.setCustomValidity('Age cannot be negative.');
                    } else {
                        this.setCustomValidity('');
                    }
                });
            }
        }

        // Function to convert age to years for database storage
        function convertAgeToYears(age, unit) {
            if (!age || !unit) return null;
            
            const ageNum = parseFloat(age);
            
            if (unit === 'months') {
                return Math.round((ageNum / 12) * 100) / 100; // Convert months to years, round to 2 decimals
            } else if (unit === 'years') {
                return ageNum;
            }
            
            return ageNum;
        }

        // Function to display age in human-readable format
        function formatAgeDisplay(ageInYears) {
            if (!ageInYears || ageInYears === 0) return 'N/A';
            
            const years = parseFloat(ageInYears);
            
            // If less than 1 year, show in months
            if (years < 1) {
                const months = Math.round(years * 12);
                return `${months} month${months !== 1 ? 's' : ''}`;
            }
            
            // If it's a whole number, show as years
            if (years === Math.floor(years)) {
                return `${Math.floor(years)} year${Math.floor(years) !== 1 ? 's' : ''}`;
            }
            
            // If it has decimals (converted from months), show in a readable format
            const wholeYears = Math.floor(years);
            const extraMonths = Math.round((years - wholeYears) * 12);
            
            if (wholeYears === 0) {
                return `${extraMonths} month${extraMonths !== 1 ? 's' : ''}`;
            } else if (extraMonths === 0) {
                return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}`;
            } else {
                return `${wholeYears}y ${extraMonths}m`;
            }
        }

        // Get age category for styling
        function getAgeCategory(ageInYears) {
            if (!ageInYears) return '';
            const years = parseFloat(ageInYears);
            
            if (years < 1) return 'infant';
            if (years < 3) return 'toddler';
            if (years < 13) return 'child';
            return 'teen';
        }

        // Function to update relationship label based on record type
        function updateRelationshipLabel() {
            const recordType = document.getElementById('recordType').value;
            const relationshipLabel = document.getElementById('relationshipLabel');
            
            if (recordType === 'Victim') {
                relationshipLabel.textContent = 'Relationship to Victim';
            } else if (recordType === 'Witness') {
                relationshipLabel.textContent = 'Relationship to Witness';
            } else {
                relationshipLabel.textContent = 'Relationship to Child';
            }
        }

        // Generate next case ID
        function generateCaseId() {
            const recordType = document.getElementById('recordType').value;
            const caseIdInput = document.getElementById('caseId');
            
            if (!recordType || !selectedAgency) {
                caseIdInput.value = '';
                return;
            }

            const suffix = recordType === 'Victim' ? 'CV' : 'CW';
            const prefix = `${selectedAgency}-${suffix}`;
            
            const existingIds = allData
                .filter(record => record['cvw code'] && record['cvw code'].startsWith(prefix))
                .map(record => {
                    const match = record['cvw code'].match(/(\d+)$/);
                    return match ? parseInt(match[1]) : 0;
                });
            
            const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            caseIdInput.value = `${prefix}${nextNumber}`;
        }

        // Add new record locally
        function addRecordLocally(recordData) {
            console.log('📱 Adding record locally:', recordData);
            
            const newRecord = {
                'cvw code': recordData.caseId,
                'Record Type': recordData.recordType,
                'Date Reported': new Date(recordData.dateReported),
                'District': recordData.district,
                'CVW Gender': recordData.cvwGender,
                'CVW Age': parseFloat(recordData.cvwAge) || 0,
                'Offender Gender': recordData.offenderGender || '',
                'Offender Age': parseInt(recordData.offenderAge) || 0,
                'Crime Type': recordData.crimeType,
                'Disability': recordData.disability || 'NON',
                'Services Rendered': recordData.servicesRendered || '',
                'Relationship to CV': recordData.relationshipToCv || ''
            };
            
            allData.push(newRecord);
            filteredData = [...allData];
            
            // Save to localStorage for persistence
            saveDataToLocalStorage();
            
            // Force update for all users
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'viewer')) {
                updateFilters();
                updateDashboard();
            }
            
            console.log('💾 Record saved locally. Total records:', allData.length);
        }

        // Save data to localStorage for persistence
        function saveDataToLocalStorage() {
            try {
                const dataToSave = allData.map(record => ({
                    ...record,
                    'Date Reported': record['Date Reported'].toISOString() // Convert date to string for storage
                }));
                localStorage.setItem('cvw_dashboard_data', JSON.stringify(dataToSave));
                console.log('💾 Data saved to localStorage:', allData.length, 'records');
                
            } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
                showNotification('⚠️ Storage error - your device may be low on storage space.', 'error');
            }
        }

        // Load data from localStorage
        function loadDataFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('cvw_dashboard_data');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    return parsedData.map(record => ({
                        ...record,
                        'Date Reported': new Date(record['Date Reported']) // Convert back to Date object
                    }));
                }
                return null;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                return null;
            }
        }

        // Load fallback data
        function loadFallbackData() {
            // First try to load from localStorage
            const savedData = loadDataFromLocalStorage();
            if (savedData && savedData.length > 0) {
                allData = savedData;
                console.log('💾 Data loaded from localStorage:', allData.length, 'records');
                return;
            }

            // If no saved data, use default fallback data
            const csvData = `cvw code,Record Type,Date Reported,District,CVW Gender,CVW Age,Offender Gender,Offender Age,Crime Type,Disability,Services Rendered,Relationship to CV
NPA-CV1,Victim,1/4/2025,Lusaka,MALE,5,FEMALE,25,ASSAULT ON A CHILD,NON,MEDICAL REPORT,STRANGER
NPA-CV2,Victim,2/2/2025,Lusaka,FEMALE,8,MALE,30,PHYSICAL ABUSE,PHYSICAL,MEDICAL + COUNSELLING,STRANGER
MOH-CV3,Victim,1/27/2025,Solwezi,FEMALE,10,MALE,40,SEXUAL ASSAULT,MENTAL,MEDICAL + COUNSELLING,LANDLORD
ZP-CV4,Victim,3/11/2025,Lusaka,FEMALE,12,MALE,50,RAPE,MENTAL+PHYSICAL,MEDICAL + COUNSELLING,FATHER
NPA-CW5,Witness,2/7/2025,Katete,MALE,15,FEMALE,60,RAPE,NON,COUNSELLING,FRIEND
MOH-CV6,Victim,1/7/2025,Chipata,FEMALE,0.5,FEMALE,20,CHILD NEGLECT,NON,COUNSELLING,FRIEND
ZP-CW7,Witness,2/10/2025,Mansa,MALE,0.75,MALE,30,DEFILEMENT,PHYSICAL,MEDICAL + COUNSELLING,STRANGER`;

            const lines = csvData.trim().split('\n');
            const headers = lines[0].split(',');
            const rawData = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                rawData.push(row);
            }

            allData = rawData.map(row => ({
                ...row,
                'CVW Gender': row['CVW Gender'].replace('FEMAL', 'FEMALE'),
                'Offender Gender': row['Offender Gender'].replace('FEMAL', 'FEMALE'),
                'CVW Age': parseFloat(row['CVW Age']) || 0,
                'Offender Age': parseFloat(row['Offender Age']) || 0,
                'Date Reported': new Date(row['Date Reported'])
            }));

            console.log('📋 Fallback data loaded:', allData.length, 'records');
            
            // Save the initial data to localStorage
            saveDataToLocalStorage();
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, type === 'error' ? 5000 : 3000);
        }

        // Modal functions
        function openAddRecordModal() {
            // Check permissions
            if (!hasPermission('add')) {
                showNotification('❌ You do not have permission to add records.', 'error');
                return;
            }
            
            // Check if agency is selected
            if (!selectedAgency) {
                showNotification('⚠️ Please select a reporting agency first.', 'error');
                return;
            }
            
            console.log('📱 Opening add record modal');
            
            document.getElementById('addRecordModal').style.display = 'block';
            document.getElementById('dateReported').value = new Date().toISOString().split('T')[0];
            document.getElementById('caseId').value = '';
            
            // Update modal title to show selected agency
            const agencyNames = {
                'NPA': 'National Prosecution Authority',
                'MOH': 'Ministry of Health', 
                'ZP': 'Zambia Police'
            };
            document.querySelector('.modal-title').innerHTML = `➕ Add New Case Record - ${agencyNames[selectedAgency]}`;
            
            // Mobile-specific adjustments
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
        }

        function closeAddRecordModal() {
            console.log('📱 Closing add record modal');
            
            document.getElementById('addRecordModal').style.display = 'none';
            document.getElementById('addRecordForm').reset();
            hideMessages();
            
            // Reset age input styling
            const ageInput = document.getElementById('cvwAge');
            if (ageInput) {
                ageInput.style.borderColor = '#dee2e6';
                ageInput.style.backgroundColor = 'white';
            }
            
            // Reset mobile-specific adjustments
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'auto';
            }
            
            updateRelationshipLabel();
        }

        function showSuccessMessage(message) {
            const successMsg = document.getElementById('successMessage');
            successMsg.textContent = message;
            successMsg.style.display = 'block';
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 3000);
        }

        function showErrorMessage(message) {
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
            setTimeout(() => {
                errorMsg.style.display = 'none';
            }, 5000);
        }

        function hideMessages() {
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
        }

        // Search functions
        function toggleSearchSection() {
            const searchSection = document.getElementById('searchSection');
            if (searchSection.style.display === 'none') {
                searchSection.style.display = 'block';
            } else {
                searchSection.style.display = 'none';
                clearSearch();
            }
        }

        function searchRecord() {
            const searchInput = document.getElementById('searchInput').value.trim().toUpperCase();
            const searchResults = document.getElementById('searchResults');
            
            if (!searchInput) {
                showNotification('Please enter a Case ID to search', 'error');
                return;
            }
            
            const foundRecord = allData.find(record => record['cvw code'] && record['cvw code'].toUpperCase() === searchInput);
            
            if (foundRecord) {
                const ageDisplay = formatAgeDisplay(foundRecord['CVW Age']);
                searchResults.innerHTML = `
                    <h4 style="color: #059669; margin-bottom: 15px;">✅ Record Found</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div><strong>Case ID:</strong> ${foundRecord['cvw code']}</div>
                        <div><strong>Type:</strong> <span class="status-badge ${foundRecord['Record Type'].toLowerCase()}-badge">${foundRecord['Record Type']}</span></div>
                        <div><strong>Date:</strong> ${foundRecord['Date Reported'].toLocaleDateString()}</div>
                        <div><strong>District:</strong> ${foundRecord['District']}</div>
                        <div><strong>Gender:</strong> ${foundRecord['CVW Gender']}</div>
                        <div><strong>Age:</strong> <span class="age-display ${getAgeCategory(foundRecord['CVW Age'])}">${ageDisplay}</span></div>
                        <div><strong>Crime Type:</strong> ${foundRecord['Crime Type']}</div>
                        <div><strong>Disability:</strong> ${foundRecord['Disability']}</div>
                        <div><strong>Services:</strong> ${foundRecord['Services Rendered'] || 'Not specified'}</div>
                        <div><strong>Relationship:</strong> ${foundRecord['Relationship to CV'] || 'Not specified'}</div>
                    </div>
                `;
                searchResults.style.display = 'block';
                showNotification(`✅ Record found: ${foundRecord['cvw code']}`, 'success');
            } else {
                searchResults.innerHTML = `
                    <h4 style="color: #dc2626; margin-bottom: 10px;">❌ Record Not Found</h4>
                    <p>No record found with Case ID: <strong>${searchInput}</strong></p>
                    <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">
                        Make sure the Case ID is correct (e.g., NPA-CV1, MOH-CW5, ZP-CV12)
                    </p>
                `;
                searchResults.style.display = 'block';
                showNotification(`❌ No record found with Case ID: ${searchInput}`, 'error');
            }
        }

        function clearSearch() {
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').style.display = 'none';
        }

        // Dashboard functions
        function showDashboardView() {
            document.querySelector('.kpi-section').scrollIntoView({ behavior: 'smooth' });
        }

        function clearAllData() {
            // Check permissions
            if (!hasPermission('admin')) {
                showNotification('❌ You do not have permission to clear data.', 'error');
                return;
            }
            
            if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone!')) {
                localStorage.removeItem('cvw_dashboard_data');
                allData = [];
                filteredData = [];
                if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'viewer')) {
                    updateDashboard();
                }
                showNotification('✅ All data cleared successfully!', 'success');
                
                // Reload fallback data
                loadFallbackData();
                filteredData = [...allData];
                if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'viewer')) {
                    updateFilters();
                    updateDashboard();
                }
            }
        }

        // Placeholder functions for dashboard (simplified for demo)
        function updateFilters() {
            // Update district filter
            const districts = [...new Set(allData.map(d => d.District))].sort();
            const districtSelect = document.getElementById('districtFilter');
            if (districtSelect) {
                const currentValue = districtSelect.value;
                districtSelect.innerHTML = '<option value="">All Districts</option>';
                districts.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    districtSelect.appendChild(option);
                });
                districtSelect.value = currentValue;
            }

            // Update crime type filter
            const crimeTypes = [...new Set(allData.map(d => d['Crime Type']))].sort();
            const crimeSelect = document.getElementById('crimeTypeFilter');
            if (crimeSelect) {
                const currentCrimeValue = crimeSelect.value;
                crimeSelect.innerHTML = '<option value="">All Crime Types</option>';
                crimeTypes.forEach(crime => {
                    const option = document.createElement('option');
                    option.value = crime;
                    option.textContent = crime;
                    crimeSelect.appendChild(option);
                });
                crimeSelect.value = currentCrimeValue;
            }

            // Update services filter  
            const services = [...new Set(allData.map(d => d['Services Rendered']).filter(s => s))].sort();
            const servicesSelect = document.getElementById('servicesFilter');
            if (servicesSelect) {
                const currentServicesValue = servicesSelect.value;
                servicesSelect.innerHTML = '<option value="">All Services</option>';
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service;
                    option.textContent = service;
                    servicesSelect.appendChild(option);
                });
                servicesSelect.value = currentServicesValue;
            }
        }

        function setupFilters() {
            updateFilters();
            // Add event listeners for filters would go here
        }

        function updateDashboard() {
            updateKPIs();
            updateTable();
            // Charts would be updated here if Chart.js is available
        }

        function updateKPIs() {
            const totalCases = filteredData.length;
            const victimCases = filteredData.filter(d => d['Record Type'] === 'Victim').length;
            const witnessCases = filteredData.filter(d => d['Record Type'] === 'Witness').length;
            const avgAge = filteredData.filter(d => d['CVW Age'] > 0).reduce((sum, d) => sum + d['CVW Age'], 0) / filteredData.filter(d => d['CVW Age'] > 0).length || 0;

            const totalCasesEl = document.getElementById('totalCases');
            const victimCasesEl = document.getElementById('victimCases');
            const witnessCasesEl = document.getElementById('witnessCases');
            const avgAgeEl = document.getElementById('avgAge');

            if (totalCasesEl) totalCasesEl.textContent = totalCases;
            if (victimCasesEl) victimCasesEl.textContent = victimCases;
            if (witnessCasesEl) witnessCasesEl.textContent = witnessCases;
            if (avgAgeEl) avgAgeEl.textContent = formatAgeDisplay(avgAge);
        }

        function updateTable() {
            const tbody = document.getElementById('caseTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';

            const displayData = filteredData.slice(0, 50);

            if (displayData.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="10" style="text-align: center; padding: 20px; color: #666;">No data available</td>';
                tbody.appendChild(tr);
                return;
            }

            displayData.forEach(row => {
                const ageDisplay = formatAgeDisplay(row['CVW Age']);
                const ageCategory = getAgeCategory(row['CVW Age']);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row['cvw code'] || 'N/A'}</td>
                    <td><span class="status-badge ${row['Record Type'].toLowerCase()}-badge">${row['Record Type']}</span></td>
                    <td>${row['Date Reported'].toLocaleDateString()}</td>
                    <td>${row['District']}</td>
                    <td>${row['CVW Gender']}</td>
                    <td><span class="age-display ${ageCategory}">${ageDisplay}</span></td>
                    <td>${row['Crime Type']}</td>
                    <td>${row['Disability']}</td>
                    <td>${row['Services Rendered'] || 'N/A'}</td>
                    <td>${row['Relationship to CV'] || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });

            if (filteredData.length > 50) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="10" style="text-align: center; font-style: italic; color: #666;">Showing first 50 of ${filteredData.length} records</td>`;
                tbody.appendChild(tr);
            }
        }

        function resetFilters() {
            const filterIds = ['districtFilter', 'recordTypeFilter', 'crimeTypeFilter', 'genderFilter', 'dateFromFilter', 'dateToFilter', 'servicesFilter'];
            filterIds.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
            filteredData = [...allData];
            updateDashboard();
        }

        // Initialize dashboard
        function initializeDashboard() {
            try {
                console.log('🚀 Initializing CVW Dashboard...');
                
                // Load data
                loadFallbackData();
                filteredData = [...allData];
                
                // Setup UI
                setupFilters();
                updateDashboard();
                
                console.log('✅ Dashboard initialized successfully');
                
            } catch (error) {
                console.error('❌ Error initializing dashboard:', error);
                showNotification('❌ Error loading dashboard data', 'error');
            }
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Check for existing session
            if (!checkSession()) {
                showLoginScreen();
            }

            // Login form submission
            document.getElementById('loginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                if (login(username, password)) {
                    document.getElementById('loginError').style.display = 'none';
                } else {
                    document.getElementById('loginError').style.display = 'block';
                }
            });

            // Setup age input handlers
            setupAgeInputHandlers();
            
            // Form submission for adding records
            document.getElementById('addRecordForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                console.log('📝 Form submission started...');
                
                // Check permissions
                if (!hasPermission('add')) {
                    showErrorMessage('❌ You do not have permission to add records.');
                    return;
                }
                
                // Disable submit button to prevent double submission
                const submitBtn = e.target.querySelector('.submit-btn');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '⏳ Saving...';
                
                try {
                    const recordData = {};
                    
                    // Collect form data manually for better mobile compatibility
                    recordData.caseId = document.getElementById('caseId').value;
                    recordData.recordType = document.getElementById('recordType').value;
                    recordData.dateReported = document.getElementById('dateReported').value;
                    recordData.district = document.getElementById('district').value;
                    recordData.cvwGender = document.getElementById('cvwGender').value;
                    recordData.disability = document.getElementById('disability').value;
                    recordData.cvwAge = document.getElementById('cvwAge').value;
                    recordData.ageUnit = document.getElementById('ageUnit').value;
                    recordData.servicesRendered = document.getElementById('servicesRendered').value;
                    recordData.offenderGender = document.getElementById('offenderGender').value;
                    recordData.crimeType = document.getElementById('crimeType').value;
                    recordData.offenderAge = document.getElementById('offenderAge').value;
                    recordData.relationshipToCv = document.getElementById('relationshipToCv').value;
                    
                    console.log('📋 Collected form data:', recordData);
                    
                    // Validate required fields
                    const requiredFields = ['recordType', 'dateReported', 'district', 'cvwGender', 'crimeType', 'cvwAge', 'ageUnit'];
                    const missingFields = requiredFields.filter(field => !recordData[field] || recordData[field].trim() === '');
                    
                    if (missingFields.length > 0) {
                        showErrorMessage('Please fill in all required fields: ' + missingFields.join(', '));
                        return;
                    }
                    
                    // Check if agency is selected
                    if (!selectedAgency) {
                        showErrorMessage('⚠️ Please select a reporting agency first.');
                        return;
                    }
                    
                    // Convert age to years for database storage
                    const originalAge = recordData.cvwAge;
                    const originalUnit = recordData.ageUnit;
                    const ageInYears = convertAgeToYears(originalAge, originalUnit);
                    
                    recordData.cvwAge = ageInYears;
                    
                    // Auto-generate case ID if needed
                    if (!recordData.caseId) {
                        generateCaseId();
                        recordData.caseId = document.getElementById('caseId').value;
                    }
                    
                    console.log('💾 Attempting to save record:', recordData);
                    
                    // Add record locally
                    addRecordLocally(recordData);
                    
                    // Update filters and dashboard for admin/viewer
                    if (currentUser.role === 'admin' || currentUser.role === 'viewer') {
                        updateFilters();
                        updateDashboard();
                    }
                    
                    // Show success message with readable age
                    const ageDisplay = formatAgeDisplay(ageInYears);
                    showSuccessMessage(`✅ Record added successfully! Case ID: ${recordData.caseId} (Age: ${ageDisplay})`);
                    showNotification(`✅ Record added: ${recordData.caseId}`, 'success');
                    
                    console.log('✅ Record saved successfully!');
                    
                    // Reset form after delay
                    setTimeout(() => {
                        closeAddRecordModal();
                    }, 2000);
                    
                } catch (error) {
                    console.error('❌ Form submission error:', error);
                    showErrorMessage(`❌ Error adding record: ${error.message}`);
                } finally {
                    // Re-enable submit button
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        });

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('addRecordModal');
            if (event.target == modal) {
                closeAddRecordModal();
            }
        }
    </script>
</body>
</html><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CVW Case Reports Analytics Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        /* Login Screen */
        .login-container {
            max-width: 400px;
            margin: 10vh auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            text-align: center;
        }

        .login-header h1 {
            color: #2c3e50;
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .login-header p {
            color: #7f8c8d;
            font-size: 1rem;
            margin-bottom: 30px;
        }

        .login-input {
            width: 100%;
            padding: 15px;
            margin-bottom: 15px;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        .login-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .demo-accounts {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }

        .demo-accounts h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }

        .account-demo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 5px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .account-demo:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }

        .account-type {
            font-weight: 600;
            color: #495057;
        }

        .account-credentials {
            color: #6c757d;
            font-family: monospace;
        }

        .login-error {
            background: #fee2e2;
            color: #dc2626;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: none;
        }

        /* Dashboard */
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            margin: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }

        .header h1 {
            color: #2c3e50;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header p {
            color: #7f8c8d;
            font-size: 1.1rem;
        }

        .zambia-label {
            font-family: 'Georgia', serif;
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .connection-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 15px 0 0 0;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
            background: #d1fae5;
            color: #059669;
            border: 1px solid #10b981;
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* User Info Bar */
        .user-info-bar {
            background: rgba(255, 255, 255, 0.95);
            padding: 12px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            margin-bottom: 20px;
        }

        .user-details {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
        }

        .user-info {
            display: flex;
            flex-direction: column;
        }

        .user-name {
            font-weight: 600;
            color: #2c3e50;
            font-size: 1rem;
        }

        .user-role {
            font-size: 0.8rem;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .logout-btn {
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            background: #c82333;
        }

        /* Role-based styling */
        .role-admin .user-avatar { background: linear-gradient(135deg, #28a745, #20c997); }
        .role-viewer .user-avatar { background: linear-gradient(135deg, #17a2b8, #6f42c1); }
        .role-reporter .user-avatar { background: linear-gradient(135deg, #ffc107, #fd7e14); }

        /* Action Buttons */
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .action-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .action-btn:hover:not(:disabled) {
            transform: translateY(-2px);
        }

        .view-dashboard-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }

        /* Search Section */
        .search-section {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        /* Agency Selection */
        .agency-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            border-color: #667eea !important;
        }

        .agency-btn.selected {
            border-color: #667eea !important;
            background: linear-gradient(135deg, #667eea, #764ba2) !important;
            color: white !important;
        }

        .agency-btn.selected div {
            color: white !important;
        }

        .agency-btn.selected .agency-code {
            color: #fff !important;
            background: rgba(255, 255, 255, 0.2) !important;
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
        }

        .modal-content {
            background: white;
            margin: 2% auto;
            padding: 30px;
            border-radius: 20px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ecf0f1;
        }

        .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
        }

        .close {
            color: #95a5a6;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .close:hover {
            color: #e74c3c;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            padding: 12px 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .full-width {
            grid-column: 1 / -1;
        }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 15px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
        }

        .cancel-btn {
            padding: 12px 24px;
            background: #95a5a6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .cancel-btn:hover {
            background: #7f8c8d;
        }

        .submit-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        }

        .success-message {
            background: #d1fae5;
            color: #059669;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #10b981;
            display: none;
        }

        .error-message {
            background: #fee2e2;
            color: #dc2626;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #ef4444;
            display: none;
        }

        /* Enhanced Age Input Styling */
        .age-input-container {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .age-input-container input {
            flex: 2;
        }

        .age-input-container select {
            flex: 1;
        }

        /* Age display in tables with color coding */
        .age-display {
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }

        .age-display.infant {
            background-color: #fee2e2;
            color: #dc2626;
            font-weight: 600;
        }

        .age-display.toddler {
            background-color: #fed7aa;
            color: #ea580c;
            font-weight: 600;
        }

        .age-display.child {
            background-color: #dcfce7;
            color: #059669;
        }

        .age-display.teen {
            background-color: #dbeafe;
            color: #2563eb;
        }

        /* Highlight months selection */
        select option[value="months"] {
            background-color: #fef2f2;
            font-weight: 600;
        }

        /* Form validation styling */
        input:invalid {
            border-color: #ef4444;
        }

        input:valid {
            border-color: #10b981;
        }

        .age-help-text {
            color: #666;
            font-size: 0.8rem;
            margin-top: 5px;
            font-style: italic;
        }

        /* KPI Section */
        .kpi-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .kpi-card {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        }

        .kpi-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
        }

        .kpi-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .kpi-label {
            font-size: 1rem;
            opacity: 0.9;
            font-weight: 500;
        }

        /* Charts */
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }

        .chart-container {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .chart-container:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .chart-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }

        .chart-canvas {
            max-height: 300px;
        }

        /* Filters */
        .filters-section {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            align-items: end;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
        }

        .filter-group label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }

        .filter-group select,
        .date-input {
            padding: 10px 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .filter-group select:focus,
        .date-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .reset-btn {
            padding: 10px 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            height: fit-content;
        }

        .reset-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(238, 90, 82, 0.3);
        }

        /* Table */
        .table-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        .data-table th {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
        }

        .data-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #ecf0f1;
            transition: background-color 0.2s ease;
        }

        .data-table tr:hover td {
            background-color: #f8f9fa;
        }

        .table-wrapper {
            max-height: 400px;
            overflow-y: auto;
            border-radius: 10px;
            border: 1px solid #dee2e6;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .victim-badge { background: #fee2e2; color: #dc2626; }
        .witness-badge { background: #dbeafe; color: #2563eb; }

        /* Utility Classes */
        .hidden { 
            display: none !important; 
        }

        /* Notification */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 2000;
            display: none;
            font-weight: 600;
            max-width: 400px;
            word-wrap: break-word;
            white-space: pre-line;
        }

        .notification.success {
            background: #d1fae5;
            color: #059669;
            border: 1px solid #10b981;
        }

        .notification.error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #ef4444;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .dashboard-container {
                padding: 15px;
                margin: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .zambia-label {
                font-size: 20px;
            }

            .charts-grid {
                grid-template-columns: 1fr;
            }

            .filters-grid {
                grid-template-columns: 1fr;
            }

            .kpi-section {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .modal-content {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 15px;
                border-radius: 0;
                max-height: 100vh;
                overflow-y: auto;
            }

            .modal {
                padding: 0;
            }

            .action-buttons {
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }

            .action-btn {
                width: 90%;
                max-width: 300px;
                padding: 15px;
                font-size: 16px;
            }

            .age-input-container {
                flex-direction: column;
                gap: 8px;
            }

            .age-input-container input,
            .age-input-container select {
                flex: none;
                width: 100%;
                padding: 15px;
                font-size: 16px;
            }

            .form-group input,
            .form-group select {
                padding: 15px;
                font-size: 16px;
                border-radius: 8px;
            }

            .user-info-bar {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }

            #agencySelection {
                margin-bottom: 10px;
            }

            #agencySelection > div {
                flex-direction: column;
                gap: 10px;
            }

            .agency-btn {
                min-width: auto;
                width: 100%;
                padding: 25px 15px;
                font-size: 14px;
            }

            .login-container {
                margin: 5% auto;
                width: 95%;
                padding: 30px 20px;
            }

            .submit-btn, .cancel-btn {
                padding: 15px 25px;
                font-size: 16px;
                min-height: 50px;
            }

            /* Mobile form improvements */
            .form-group label {
                font-size: 16px;
                margin-bottom: 10px;
            }

            .modal-title {
                font-size: 1.3rem;
                line-height: 1.4;
            }

            /* Ensure tap targets are at least 44px */
            button, .action-btn, .agency-btn {
                min-height: 44px;
                touch-action: manipulation;
            }

            /* Prevent zoom on input focus for iOS */
            input, select, textarea {
                font-size: 16px !important;
                transform-origin: left top;
            }
        }

        @media (max-width: 480px) {
            .kpi-section {
                grid-template-columns: 1fr;
            }

            .login-container {
                margin: 5% auto;
                width: 95%;
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Login Screen -->
    <div id="loginScreen" class="login-container">
        <div class="login-header">
            <h1>🔐 CVW Dashboard</h1>
            <p>Zambia Child Victim & Witness Analytics</p>
        </div>
        
        <div class="login-error" id="loginError">
            ❌ Invalid username or password
        </div>
        
        <form class="login-form" id="loginForm">
            <input type="text" id="username" class="login-input" placeholder="Username" required>
            <input type="password" id="password" class="login-input" placeholder="Password" required>
            <button type="submit" class="login-btn">🚀 Login</button>
        </form>
        
        <div class="demo-accounts">
            <h3>📋 Demo Accounts</h3>
            <div class="account-demo" onclick="quickLogin('admin', 'admin123')">
                <span class="account-type">👑 Admin</span>
                <span class="account-credentials">admin / admin123</span>
            </div>
            <div class="account-demo" onclick="quickLogin('viewer', 'view123')">
                <span class="account-type">👀 Viewer</span>
                <span class="account-credentials">viewer / view123</span>
            </div>
            <div class="account-demo" onclick="quickLogin('reporter', 'report123')">
                <span class="account-type">📝 Reporter</span>
                <span class="account-credentials">reporter / report123</span>
            </div>
        </div>
    </div>

    <!-- Notification Container -->
    <div id="notification" class="notification"></div>

    <!-- Main Dashboard -->
    <div id="mainDashboard" class="hidden">
        <!-- User Info Bar -->
        <div id="userInfoBar" class="user-info-bar">
            <div class="user-details">
                <div id="userAvatar" class="user-avatar">A</div>
                <div class="user-info">
                    <div id="userName" class="user-name">Administrator</div>
                    <div id="userRole" class="user-role">Admin Account</div>
                </div>
            </div>
            <button class="logout-btn" onclick="logout()">🚪 Logout</button>
        </div>

        <div class="dashboard-container">
            <!-- Header -->
            <div class="header">
                <h1>📊 CVW Case Reports Analytics</h1>
                <p class="zambia-label">Zambia</p>
                <p>Comprehensive Analysis of Child Victim & Witness Cases</p>
                
                <div class="connection-status">
                    <div class="status-indicator"></div>
                    <span>Database Connected</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons" id="actionButtons">
                <button class="action-btn add-record-btn" id="addRecordBtn" onclick="openAddRecordModal()" style="background: linear-gradient(135deg, #10b981, #059669); color: white;" disabled>
                    ➕ Add New Record
                </button>
                <button class="action-btn search-records-btn" id="searchRecordsBtn" onclick="toggleSearchSection()" style="background: linear-gradient(135deg, #2196f3, #1976d2); color: white;">
                    🔍 Search Records
                </button>
                <button class="action-btn view-dashboard-btn" id="viewDashboardBtn" onclick="showDashboardView()">
                    📈 View Dashboard
                </button>
                <button class="action-btn clear-data-btn" id="clearDataBtn" onclick="clearAllData()" style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white;">
                    🗑️ Clear Data
                </button>
            </div>

            <!-- Search Section -->
            <div class="search-section" id="searchSection" style="display: none;">
                <h3 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">🔍 Search & Update Records</h3>
                <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px; position: relative;">
                        <input type="text" id="searchInput" placeholder="Enter Case ID (e.g., NPA-CV1, MOH-CW5, ZP-CV12)" 
                               style="width: 100%; padding: 12px 45px 12px 15px; border: 2px solid #dee2e6; border-radius: 10px; font-size: 15px;">
                        <span style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #2196f3; font-size: 20px;">🔍</span>
                    </div>
                    <button onclick="searchRecord()" style="padding: 12px 24px; background: linear-gradient(135deg, #2196f3, #1976d2); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Search</button>
                    <button onclick="clearSearch()" style="padding: 12px 24px; background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Clear</button>
                </div>
                
                <div id="searchResults" style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; display: none;">
                    <!-- Search results will appear here -->
                </div>
            </div>

            <!-- Agency Selection -->
            <div id="agencySelection" class="filters-section hidden" style="margin-bottom: 20px;">
                <h3 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">🏛️ Select Reporting Agency</h3>
                <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <button class="agency-btn" data-agency="NPA" onclick="selectAgency('NPA')" style="background: white; border: 3px solid #dee2e6; border-radius: 15px; padding: 20px; min-width: 200px; cursor: pointer; text-align: center; transition: all 0.3s ease;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">⚖️</div>
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: #2c3e50;" class="agency-name">National Prosecution Authority</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 0.9rem; background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; display: inline-block;" class="agency-code">NPA</div>
                    </button>
                    <button class="agency-btn" data-agency="MOH" onclick="selectAgency('MOH')" style="background: white; border: 3px solid #dee2e6; border-radius: 15px; padding: 20px; min-width: 200px; cursor: pointer; text-align: center; transition: all 0.3s ease;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">🏥</div>
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: #2c3e50;" class="agency-name">Ministry of Health</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 0.9rem; background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; display: inline-block;" class="agency-code">MOH</div>
                    </button>
                    <button class="agency-btn" data-agency="ZP" onclick="selectAgency('ZP')" style="background: white; border: 3px solid #dee2e6; border-radius: 15px; padding: 20px; min-width: 200px; cursor: pointer; text-align: center; transition: all 0.3s ease;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">👮</div>
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: #2c3e50;" class="agency-name">Zambia Police</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 0.9rem; background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; display: inline-block;" class="agency-code">ZP</div>
                    </button>
                </div>
            </div>

            <!-- Reporter Only Content -->
            <div id="reporterOnlyContent" class="hidden">
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 15px;">
                    <h2>📝 Reporter Dashboard</h2>
                    <p>Welcome! You have access to add new case records and search existing ones.</p>
                    <p><strong>Select your agency above, then you can start adding records.</strong></p>
                    <p><strong>Step 1:</strong> Click on your agency above</p>
                    <p><strong>Step 2:</strong> Click "Add New Record" to report a new case</p>
                    <p><strong>Step 3:</strong> Use "Search Records" to find existing cases</p>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-top: 20px;">
                        <strong>Case ID Prefixes:</strong><br>
                        • <strong>NPA-CV/CW:</strong> National Prosecution Authority<br>
                        • <strong>MOH-CV/CW:</strong> Ministry of Health<br>
                        • <strong>ZP-CV/CW:</strong> Zambia Police
                    </div>
                </div>
            </div>

            <!-- Filters Section (Hidden for Reporter) -->
            <div class="filters-section" id="filtersSection">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label for="districtFilter">District</label>
                        <select id="districtFilter">
                            <option value="">All Districts</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="recordTypeFilter">Record Type</label>
                        <select id="recordTypeFilter">
                            <option value="">All Types</option>
                            <option value="Victim">Victim</option>
                            <option value="Witness">Witness</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="crimeTypeFilter">Crime Type</label>
                        <select id="crimeTypeFilter">
                            <option value="">All Crime Types</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="genderFilter">Gender</label>
                        <select id="genderFilter">
                            <option value="">All Genders</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="dateFromFilter">Date From</label>
                        <input type="date" id="dateFromFilter" class="date-input">
                    </div>
                    <div class="filter-group">
                        <label for="dateToFilter">Date To</label>
                        <input type="date" id="dateToFilter" class="date-input">
                    </div>
                    <div class="filter-group">
                        <label for="servicesFilter">Services Rendered</label>
                        <select id="servicesFilter">
                            <option value="">All Services</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="reset-btn" onclick="resetFilters()">🔄 Reset Filters</button>
                    </div>
                </div>
            </div>

            <!-- KPI Section (Hidden for Reporter) -->
            <div class="kpi-section" id="kpiSection">
                <div class="kpi-card">
                    <div class="kpi-value" id="totalCases">0</div>
                    <div class="kpi-label">Total Cases</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value" id="victimCases">0</div>
                    <div class="kpi-label">Victim Cases</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value" id="witnessCases">0</div>
                    <div class="kpi-label">Witness Cases</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value" id="avgAge">0</div>
                    <div class="kpi-label">Average Age</div>
                </div>
            </div>

            <!-- Charts Section (Hidden for Reporter) -->
            <div class="charts-grid" id="chartsSection">
                <div class="chart-container">
                    <div class="chart-title">Cases by District</div>
                    <canvas id="districtChart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Crime Types Distribution</div>
                    <canvas id="crimeChart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Age Distribution</div>
                    <canvas id="ageChart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Gender Distribution</div>
                    <canvas id="genderChart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Cases Over Time</div>
                    <canvas id="timeChart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Services Rendered Distribution</div>
                    <canvas id="servicesChart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Relationship Analysis</div>
                    <canvas id="relationshipChart" class="chart-canvas"></canvas>
                </div>
            </div>

            <!-- Table Section (Hidden for Reporter) -->
            <div class="table-container full-width" id="tableSection">
                <div class="chart-title">Case Details</div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>District</th>
                                <th>Gender</th>
                                <th>Age</th>
                                <th>Crime Type</th>
                                <th>Disability</th>
                                <th>Services</th>
                                <th>Relationship</th>
                            </tr>
                        </thead>
                        <tbody id="caseTableBody">
                            <tr>
                                <td colspan="10" style="text-align: center; padding: 20px; color: #666;">
                                    Loading case data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Record Modal -->
    <div id="addRecordModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">➕ Add New Case Record</h2>
                <span class="close" onclick="closeAddRecordModal()">&times;</span>
            </div>
            
            <div class="success-message" id="successMessage">
                ✅ Record added successfully!
            </div>
            
            <div class="error-message" id="errorMessage">
                ❌ Please fill in all required fields.
            </div>

            <form id="addRecordForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="caseId">Case ID</label>
                        <input type="text" id="caseId" name="caseId" placeholder="Auto-generated based on agency and record type" readonly>
                        <small style="color: #666; margin-top: 5px;">Format: [AGENCY]-[CV/CW][NUMBER] (e.g., NPA-CV1, MOH-CW5, ZP-CV12)</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="recordType">Record Type *</label>
                        <select id="recordType" name="recordType" required onchange="generateCaseId(); updateRelationshipLabel();">
                            <option value="">Select Type</option>
                            <option value="Victim">Victim</option>
                            <option value="Witness">Witness</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="dateReported">Date Reported *</label>
                        <input type="date" id="dateReported" name="dateReported" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="district">District *</label>
                        <select id="district" name="district" required>
                            <option value="">Select District</option>
                            <option value="Lusaka">Lusaka</option>
                            <option value="Kitwe">Kitwe</option>
                            <option value="Solwezi">Solwezi</option>
                            <option value="Katete">Katete</option>
                            <option value="Chipata">Chipata</option>
                            <option value="Mansa">Mansa</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="cvwGender">CVW Gender *</label>
                        <select id="cvwGender" name="cvwGender" required>
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    
                    <!-- DISABILITY RIGHT AFTER CVW GENDER -->
                    <div class="form-group">
                        <label for="disability">CVW Disability Status</label>
                        <select id="disability" name="disability">
                            <option value="NON">None</option>
                            <option value="PHYSICAL">Physical</option>
                            <option value="MENTAL">Mental</option>
                            <option value="MENTAL+PHYSICAL">Mental + Physical</option>
                        </select>
                    </div>
                    
                    <!-- CVW AGE WITH YEARS/MONTHS -->
                    <div class="form-group">
                        <label for="cvwAge">CVW Age *</label>
                        <div class="age-input-container">
                            <input type="number" id="cvwAge" name="cvwAge" min="0" max="120" placeholder="Enter age" required>
                            <select id="ageUnit" name="ageUnit" required>
                                <option value="">Select Unit</option>
                                <option value="years">Years</option>
                                <option value="months">Months</option>
                            </select>
                        </div>
                        <small class="age-help-text">
                            💡 Select <strong>months</strong> for infants under 1 year, <strong>years</strong> for children 1+ years old
                        </small>
                    </div>
                    
                    <!-- SERVICES RENDERED RIGHT AFTER CVW AGE -->
                    <div class="form-group">
                        <label for="servicesRendered">Services Rendered</label>
                        <select id="servicesRendered" name="servicesRendered">
                            <option value="">Select Services</option>
                            <option value="MEDICAL REPORT">Medical Report</option>
                            <option value="COUNSELLING">Counselling</option>
                            <option value="MEDICAL + COUNSELLING">Medical + Counselling</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="offenderGender">Offender Gender</label>
                        <select id="offenderGender" name="offenderGender">
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    
                    <!-- CRIME TYPE RIGHT AFTER OFFENDER GENDER -->
                    <div class="form-group">
                        <label for="crimeType">Crime Type *</label>
                        <select id="crimeType" name="crimeType" required>
                            <option value="">Select Crime Type</option>
                            <option value="ASSAULT ON A CHILD">Assault on a Child</option>
                            <option value="PHYSICAL ABUSE">Physical Abuse</option>
                            <option value="SEXUAL ASSAULT">Sexual Assault</option>
                            <option value="RAPE">Rape</option>
                            <option value="CHILD NEGLECT">Child Neglect</option>
                            <option value="DEFILEMENT">Defilement</option>
                            <option value="ONLINE SEXUAL EXPLOITATION">Online Sexual Exploitation</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="offenderAge">Offender Age</label>
                        <input type="number" id="offenderAge" name="offenderAge" min="0" placeholder="Offender Age">
                    </div>
                    
                    <!-- DYNAMIC RELATIONSHIP FIELD RIGHT AFTER OFFENDER AGE -->
                    <div class="form-group">
                        <label for="relationshipToCv" id="relationshipLabel">Relationship to Child</label>
                        <select id="relationshipToCv" name="relationshipToCv">
                            <option value="">Select Relationship</option>
                            <option value="STRANGER">Stranger</option>
                            <option value="FRIEND">Friend</option>
                            <option value="FATHER">Father</option>
                            <option value="MOTHER">Mother</option>
                            <option value="LANDLORD">Landlord</option>
                            <option value="NEIGHBOR">Neighbor</option>
                            <option value="RELATIVE">Relative</option>
                            <option value="TEACHER">Teacher</option>
                            <option value="CAREGIVER">Caregiver</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="closeAddRecordModal()">Cancel</button>
                    <button type="submit" class="submit-btn">Add Record</button>
                </div>
            </form>
        </div>
    </div>
