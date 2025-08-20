<!DOCTYPE html>
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

        .close {
            color: #95a5a6;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s ease;
            float: right;
        }

        .close:hover {
            color: #e74c3c;
        }

        /* Form Styles */
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-label {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .form-input, .form-select {
            padding: 12px 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: white;
        }

        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
                gap: 10px;
            }

            .modal-content {
                width: 95%;
                margin: 5% auto;
                padding: 20px;
            }
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

        /* Responsive Design */
        @media (max-width: 768px) {
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

            .dashboard-container {
                margin: 10px;
                padding: 20px;
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
                <button class="action-btn add-record-btn" id="addRecordBtn" onclick="openAddRecordModal()" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
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
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: #2c3e50;">National Prosecution Authority</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 0.9rem; background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; display: inline-block;">NPA</div>
                    </button>
                    <button class="agency-btn" data-agency="MOH" onclick="selectAgency('MOH')" style="background: white; border: 3px solid #dee2e6; border-radius: 15px; padding: 20px; min-width: 200px; cursor: pointer; text-align: center; transition: all 0.3s ease;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">🏥</div>
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: #2c3e50;">Ministry of Health</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 0.9rem; background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; display: inline-block;">MOH</div>
                    </button>
                    <button class="agency-btn" data-agency="ZP" onclick="selectAgency('ZP')" style="background: white; border: 3px solid #dee2e6; border-radius: 15px; padding: 20px; min-width: 200px; cursor: pointer; text-align: center; transition: all 0.3s ease;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">👮</div>
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: #2c3e50;">Zambia Police</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 0.9rem; background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; display: inline-block;">ZP</div>
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
                    
