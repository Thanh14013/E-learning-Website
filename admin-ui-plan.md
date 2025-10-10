# 🎓 ADMIN UI DESIGN PLAN - MasterDev E-learning Platform

> **Admin Folder**: `admin/src/`  
> **Target User**: System Administrators  
> **Tech Stack**: React + Context API + Socket.IO Client + Advanced Analytics + System Management

## 📋 MỤC LỤC

- [Tổng quan thiết kế](#-tổng-quan-thiết-kế)
- [Layout Structure](#-layout-structure)
- [Component Architecture](#-component-architecture)
- [Dashboard & Analytics](#-dashboard--analytics)
- [User Management](#-user-management)
- [System Configuration](#-system-configuration)
- [Content Moderation](#-content-moderation)
- [Security & Monitoring](#-security--monitoring)

---

## 🎯 TỔNG QUAN THIẾT KẾ

### **Design System cho Admin**

- **Color Scheme**:
  - Primary: `#DC2626` (Red) - Admin Authority & Alerts
  - Secondary: `#059669` (Green) - Success & Approved Actions
  - Warning: `#F59E0B` (Amber) - Pending Actions
  - Info: `#3B82F6` (Blue) - Information & Stats
  - Dark: `#1F2937` (Gray) - Professional Interface
- **Layout Philosophy**:
  - Information density priority
  - System monitoring emphasis
  - Quick action accessibility
  - Advanced filtering & search
  - Comprehensive reporting

### **Admin-specific Features**

- Advanced data tables với sorting/filtering
- Real-time system monitoring
- Bulk operations interface
- Audit trail tracking
- Multi-level permissions
- System health dashboards

---

## 🏗 LAYOUT STRUCTURE

### **Admin Layout Component** (`admin/src/components/common/AdminLayout.jsx`)

```jsx
<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
  <AdminHeader />
  <div className="flex">
    <AdminSidebar />
    <main className="flex-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb />
          <SystemStatus />
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </main>
  </div>

  {/* Fixed Elements */}
  <SystemAlertsBar />
  <NotificationCenter />
  <QuickActionsPanel />
</div>
```

### **Admin Header** (`admin/src/components/common/AdminHeader.jsx`)

**Desktop Layout:**

```
[MasterDev Admin] [Global Search] [System Health] [Quick Actions] [Alerts] [Profile]
```

**Components trong Header:**

- **Global Search**:
  - Multi-entity search (users, courses, content, logs)
  - Advanced filters dropdown
  - Recent searches
- **System Health Indicator**:
  - Real-time system status
  - Server performance metrics
  - Active sessions count
- **Quick Actions Dropdown**:
  - Create user, Approve content, Send announcement
  - System maintenance tools
- **Alerts Center**:
  - Security alerts, System errors, Pending approvals
  - Priority-based color coding
- **Admin Profile**:
  - Admin settings, Activity log, Switch role, Logout

### **Admin Sidebar** (`admin/src/components/common/AdminSidebar.jsx`)

**Navigation Structure:**

```jsx
const adminNavigation = [
  {
    section: "Overview",
    items: [
      { icon: DashboardIcon, label: "Dashboard", path: "/admin/dashboard" },
      { icon: ActivityIcon, label: "System Monitor", path: "/admin/system" },
    ],
  },
  {
    section: "User Management",
    items: [
      { icon: UsersIcon, label: "All Users", path: "/admin/users" },
      {
        icon: UserCheckIcon,
        label: "User Verification",
        path: "/admin/users/verification",
      },
      { icon: ShieldIcon, label: "Roles & Permissions", path: "/admin/roles" },
    ],
  },
  {
    section: "Content Management",
    items: [
      { icon: BookOpenIcon, label: "All Courses", path: "/admin/courses" },
      {
        icon: CheckCircleIcon,
        label: "Course Approval",
        path: "/admin/courses/approval",
      },
      {
        icon: FlagIcon,
        label: "Content Moderation",
        path: "/admin/moderation",
      },
      { icon: TagIcon, label: "Categories & Tags", path: "/admin/taxonomy" },
    ],
  },
  {
    section: "Platform Analytics",
    items: [
      {
        icon: TrendingUpIcon,
        label: "Usage Analytics",
        path: "/admin/analytics",
      },
      {
        icon: DollarSignIcon,
        label: "Revenue Reports",
        path: "/admin/revenue",
      },
      { icon: FileTextIcon, label: "Custom Reports", path: "/admin/reports" },
    ],
  },
  {
    section: "System Configuration",
    items: [
      {
        icon: SettingsIcon,
        label: "Platform Settings",
        path: "/admin/settings",
      },
      {
        icon: IntegrationIcon,
        label: "Integrations",
        path: "/admin/integrations",
      },
      {
        icon: MailIcon,
        label: "Email Templates",
        path: "/admin/email-templates",
      },
      { icon: DatabaseIcon, label: "Database Tools", path: "/admin/database" },
    ],
  },
  {
    section: "Security & Logs",
    items: [
      { icon: SecurityIcon, label: "Security Center", path: "/admin/security" },
      { icon: FileListIcon, label: "Audit Logs", path: "/admin/logs" },
      {
        icon: ExclamationIcon,
        label: "Error Monitoring",
        path: "/admin/errors",
      },
    ],
  },
];
```

---

## 🧱 COMPONENT ARCHITECTURE

### **Advanced Data Table** (`admin/src/components/common/AdvancedDataTable.jsx`)

```jsx
<div className="bg-white rounded-lg shadow-sm overflow-hidden">
  {/* Table Header với Advanced Controls */}
  <div className="p-4 border-b bg-gray-50">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex items-center space-x-3">
        <ColumnToggler
          columns={columns}
          visibleColumns={visibleColumns}
          onToggle={toggleColumn}
        />
        <ExportButton data={data} filename={exportFilename} />
        <RefreshButton onClick={refreshData} loading={loading} />
      </div>
    </div>

    {/* Advanced Filters */}
    <div className="flex flex-wrap items-center gap-3">
      <GlobalSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Search all columns..."
      />

      {filterableColumns.map((column) => (
        <ColumnFilter
          key={column.key}
          column={column}
          value={columnFilters[column.key]}
          onChange={(value) => setColumnFilter(column.key, value)}
        />
      ))}

      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  </div>

  {/* Selection & Bulk Actions */}
  {selectedRows.length > 0 && (
    <div className="bg-blue-50 border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-800">
          {selectedRows.length} item(s) selected
        </span>

        <div className="flex items-center space-x-2">
          {bulkActions.map((action) => (
            <Button
              key={action.key}
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(action.key)}
              disabled={!action.enabled}
            >
              <action.icon className="w-4 h-4 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-12 p-3">
            <Checkbox
              checked={allRowsSelected}
              indeterminate={someRowsSelected}
              onChange={toggleSelectAll}
            />
          </th>
          {visibleColumns.map((column) => (
            <th
              key={column.key}
              className="text-left p-3 font-medium text-gray-900"
            >
              <div className="flex items-center space-x-2">
                <span>{column.header}</span>
                {column.sortable && (
                  <SortButton
                    direction={
                      sortConfig?.key === column.key
                        ? sortConfig.direction
                        : null
                    }
                    onClick={() => handleSort(column.key)}
                  />
                )}
              </div>
            </th>
          ))}
          <th className="w-20 p-3">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {paginatedData.map((row, index) => (
          <tr key={row.id} className="hover:bg-gray-50">
            <td className="p-3">
              <Checkbox
                checked={selectedRows.includes(row.id)}
                onChange={() => toggleRowSelection(row.id)}
              />
            </td>

            {visibleColumns.map((column) => (
              <td key={column.key} className="p-3">
                {column.render
                  ? column.render(row[column.key], row, index)
                  : row[column.key]}
              </td>
            ))}

            <td className="p-3">
              <RowActionsMenu
                row={row}
                actions={rowActions}
                onAction={handleRowAction}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  <div className="px-4 py-3 border-t bg-gray-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <PageSizeSelector
          value={pageSize}
          onChange={setPageSize}
          options={[10, 25, 50, 100]}
        />

        <span className="text-sm text-gray-600">
          Showing {startIndex + 1}-{endIndex} of {totalCount} results
        </span>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showFirstLast
      />
    </div>
  </div>
</div>
```

### **System Metrics Widget** (`admin/src/components/dashboard/SystemMetrics.jsx`)

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MetricCard
    title="Server Status"
    value={systemHealth.status}
    icon={ServerIcon}
    color={systemHealth.status === "healthy" ? "green" : "red"}
    detail={`Uptime: ${systemHealth.uptime}`}
  />

  <MetricCard
    title="Active Users"
    value={metrics.activeUsers}
    icon={UsersIcon}
    color="blue"
    trend={{
      value: metrics.activeUsersChange,
      direction: metrics.activeUsersChange > 0 ? "up" : "down",
    }}
  />

  <MetricCard
    title="Storage Used"
    value={`${systemHealth.storageUsed}%`}
    icon={DatabaseIcon}
    color={systemHealth.storageUsed > 80 ? "red" : "yellow"}
    detail={`${systemHealth.storageUsedGB}GB / ${systemHealth.totalStorageGB}GB`}
  />

  <MetricCard
    title="API Response"
    value={`${systemHealth.avgResponseTime}ms`}
    icon={ZapIcon}
    color={systemHealth.avgResponseTime < 200 ? "green" : "yellow"}
    detail="Last 24 hours"
  />
</div>
```

---

## 📱 PAGES CHI TIẾT

### **1. Admin Dashboard** (`admin/src/pages/Dashboard.jsx`)

```jsx
<div className="space-y-8">
  {/* System Overview */}
  <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">System Administration</h1>
        <p className="text-red-100 mt-2">
          Managing {platformStats.totalUsers} users across{" "}
          {platformStats.totalCourses} courses
        </p>
      </div>

      <div className="text-right">
        <div className="text-2xl font-bold">{systemHealth.status}</div>
        <div className="text-sm text-red-100">System Status</div>
      </div>
    </div>
  </div>

  {/* Key Metrics */}
  <SystemMetrics />

  {/* Real-time Monitoring */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Live Activity Feed */}
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Live Activity Feed</h2>
        </div>

        <div className="divide-y max-h-96 overflow-y-auto">
          {liveActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <ActivityIcon
                  type={activity.type}
                  className="w-5 h-5 mt-1 text-gray-400"
                />
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    <UserTag user={activity.user} />
                    <span className="text-xs text-gray-400">
                      IP: {activity.ip}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Quick Actions & Alerts */}
    <div className="space-y-6">
      <QuickActionsWidget />
      <PendingApprovalsWidget />
      <SystemAlertsWidget />
    </div>
  </div>

  {/* Analytics Summary */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <UserGrowthChart data={userGrowthData} />
    <PlatformUsageChart data={usageData} />
  </div>

  {/* Recent Admin Actions */}
  <div className="bg-white rounded-lg shadow-sm">
    <div className="p-6 border-b">
      <h2 className="text-lg font-semibold">Recent Admin Actions</h2>
    </div>

    <AdminAuditTable
      actions={recentAdminActions}
      columns={["timestamp", "admin", "action", "target", "ip"]}
      maxRows={10}
    />
  </div>
</div>
```

### **2. User Management** (`admin/src/pages/UserManagement.jsx`)

```jsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">User Management</h1>
      <p className="text-gray-600 mt-1">
        Manage all platform users and their permissions
      </p>
    </div>

    <div className="flex items-center space-x-3">
      <Button variant="outline" onClick={() => setShowImportModal(true)}>
        <UploadIcon className="w-4 h-4 mr-2" />
        Bulk Import
      </Button>
      <Button variant="outline" onClick={exportUsers}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export Users
      </Button>
      <Button variant="primary" onClick={() => setShowCreateModal(true)}>
        <PlusIcon className="w-4 h-4 mr-2" />
        Create User
      </Button>
    </div>
  </div>

  {/* Statistics Cards */}
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <StatCard title="Total Users" value={userStats.total} color="blue" />
    <StatCard title="Students" value={userStats.students} color="green" />
    <StatCard title="Teachers" value={userStats.teachers} color="purple" />
    <StatCard
      title="Active Today"
      value={userStats.activeToday}
      color="yellow"
    />
    <StatCard
      title="Pending Verification"
      value={userStats.pending}
      color="red"
    />
  </div>

  {/* Advanced User Table */}
  <AdvancedDataTable
    title="All Users"
    data={usersData}
    columns={[
      {
        key: "user",
        header: "User",
        sortable: true,
        render: (_, user) => (
          <div className="flex items-center space-x-3">
            <Avatar src={user.avatar} name={user.fullName} />
            <div>
              <div className="font-medium">{user.fullName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        sortable: true,
        filterable: true,
        render: (role) => <RoleBadge role={role} />,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        render: (status) => <StatusBadge status={status} />,
      },
      {
        key: "lastLogin",
        header: "Last Login",
        sortable: true,
        render: (date) => (
          <div>
            <div className="text-sm">{formatDate(date)}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(date)}</div>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Joined",
        sortable: true,
        render: (date) => formatDate(date),
      },
      {
        key: "enrolledCourses",
        header: "Courses",
        render: (courses) => (
          <span className="text-sm">{courses?.length || 0}</span>
        ),
      },
    ]}
    bulkActions={[
      {
        key: "activate",
        label: "Activate",
        icon: CheckIcon,
        enabled: true,
        action: activateUsers,
      },
      {
        key: "suspend",
        label: "Suspend",
        icon: XIcon,
        enabled: true,
        action: suspendUsers,
      },
      {
        key: "delete",
        label: "Delete",
        icon: TrashIcon,
        enabled: true,
        action: deleteUsers,
        dangerous: true,
      },
    ]}
    rowActions={[
      {
        key: "view",
        label: "View Profile",
        icon: EyeIcon,
        action: viewUserProfile,
      },
      {
        key: "edit",
        label: "Edit",
        icon: EditIcon,
        action: editUser,
      },
      {
        key: "impersonate",
        label: "Impersonate",
        icon: UserIcon,
        action: impersonateUser,
      },
      {
        key: "logs",
        label: "View Logs",
        icon: FileTextIcon,
        action: viewUserLogs,
      },
    ]}
    exportFilename="platform-users"
  />

  {/* User Creation Modal */}
  <CreateUserModal
    isOpen={showCreateModal}
    onClose={() => setShowCreateModal(false)}
    onSuccess={handleUserCreated}
  />

  {/* Bulk Import Modal */}
  <BulkImportModal
    isOpen={showImportModal}
    onClose={() => setShowImportModal(false)}
    onSuccess={handleBulkImport}
  />
</div>
```

### **3. Course Management & Approval** (`admin/src/pages/CourseManagement.jsx`)

```jsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Course Management</h1>
      <p className="text-gray-600 mt-1">
        Review, approve and manage all platform courses
      </p>
    </div>

    <div className="flex items-center space-x-3">
      <Button variant="outline" onClick={exportCourseData}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export Data
      </Button>
      <Button variant="outline" onClick={() => setShowBulkActions(true)}>
        <SettingsIcon className="w-4 h-4 mr-2" />
        Bulk Actions
      </Button>
    </div>
  </div>

  {/* Course Statistics */}
  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
    <StatCard title="Total Courses" value={courseStats.total} color="blue" />
    <StatCard title="Published" value={courseStats.published} color="green" />
    <StatCard
      title="Pending Approval"
      value={courseStats.pending}
      color="yellow"
    />
    <StatCard title="Drafts" value={courseStats.drafts} color="gray" />
    <StatCard title="Suspended" value={courseStats.suspended} color="red" />
    <StatCard title="Featured" value={courseStats.featured} color="purple" />
  </div>

  {/* Pending Approvals Priority Section */}
  {pendingApprovals.length > 0 && (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-yellow-800">
          Courses Pending Approval ({pendingApprovals.length})
        </h2>
        <Button variant="outline" onClick={approveAllPending}>
          Approve All
        </Button>
      </div>

      <div className="space-y-3">
        {pendingApprovals.map((course) => (
          <PendingCourseCard
            key={course.id}
            course={course}
            onApprove={() => approveCourse(course.id)}
            onReject={() => rejectCourse(course.id)}
            onReview={() => reviewCourse(course.id)}
          />
        ))}
      </div>
    </div>
  )}

  {/* Advanced Course Table */}
  <AdvancedDataTable
    title="All Courses"
    data={coursesData}
    columns={[
      {
        key: "course",
        header: "Course",
        sortable: true,
        render: (_, course) => (
          <div className="flex items-center space-x-3">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div>
              <div className="font-medium">{course.title}</div>
              <div className="text-sm text-gray-500">{course.category}</div>
            </div>
          </div>
        ),
      },
      {
        key: "teacher",
        header: "Teacher",
        sortable: true,
        render: (_, course) => (
          <div className="flex items-center space-x-2">
            <Avatar
              src={course.teacher.avatar}
              name={course.teacher.name}
              size="sm"
            />
            <span className="text-sm">{course.teacher.name}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        render: (status) => <CourseStatusBadge status={status} />,
      },
      {
        key: "enrolledStudents",
        header: "Students",
        sortable: true,
        render: (students) => (
          <div className="text-center">
            <div className="font-medium">{students?.length || 0}</div>
          </div>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        render: (rating, course) => (
          <div className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">{rating}</span>
            <span className="text-xs text-gray-500">
              ({course.totalReviews})
            </span>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (date) => formatDate(date),
      },
      {
        key: "revenue",
        header: "Revenue",
        sortable: true,
        render: (revenue) => formatCurrency(revenue),
      },
    ]}
    bulkActions={[
      {
        key: "approve",
        label: "Approve",
        icon: CheckIcon,
        enabled: true,
        action: bulkApproveCourses,
      },
      {
        key: "feature",
        label: "Feature",
        icon: StarIcon,
        enabled: true,
        action: bulkFeatureCourses,
      },
      {
        key: "suspend",
        label: "Suspend",
        icon: PauseIcon,
        enabled: true,
        action: bulkSuspendCourses,
      },
      {
        key: "delete",
        label: "Delete",
        icon: TrashIcon,
        enabled: true,
        action: bulkDeleteCourses,
        dangerous: true,
      },
    ]}
    rowActions={[
      {
        key: "view",
        label: "Preview Course",
        icon: EyeIcon,
        action: previewCourse,
      },
      {
        key: "analytics",
        label: "View Analytics",
        icon: ChartBarIcon,
        action: viewCourseAnalytics,
      },
      {
        key: "students",
        label: "Manage Students",
        icon: UsersIcon,
        action: manageCourseStudents,
      },
      {
        key: "edit",
        label: "Edit Details",
        icon: EditIcon,
        action: editCourse,
      },
    ]}
  />
</div>
```

### **4. System Configuration** (`admin/src/pages/SystemSettings.jsx`)

```jsx
<div className="space-y-8">
  {/* Header */}
  <div>
    <h1 className="text-2xl font-bold">System Configuration</h1>
    <p className="text-gray-600 mt-1">
      Configure platform settings and integrations
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    {/* Settings Navigation */}
    <div className="lg:col-span-1">
      <nav className="space-y-1">
        {settingsSections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              activeSection === section.key
                ? "bg-red-100 text-red-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <section.icon className="w-5 h-5" />
              <span>{section.label}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>

    {/* Settings Content */}
    <div className="lg:col-span-3">
      {activeSection === "general" && (
        <GeneralSettingsPanel
          settings={platformSettings}
          onSave={updatePlatformSettings}
        />
      )}

      {activeSection === "email" && (
        <EmailSettingsPanel
          settings={emailSettings}
          onSave={updateEmailSettings}
          onTestEmail={sendTestEmail}
        />
      )}

      {activeSection === "storage" && (
        <StorageSettingsPanel
          settings={storageSettings}
          onSave={updateStorageSettings}
          onTestConnection={testStorageConnection}
        />
      )}

      {activeSection === "security" && (
        <SecuritySettingsPanel
          settings={securitySettings}
          onSave={updateSecuritySettings}
        />
      )}

      {activeSection === "features" && (
        <FeatureTogglePanel
          features={platformFeatures}
          onToggle={toggleFeature}
        />
      )}

      {activeSection === "integrations" && (
        <IntegrationsPanel
          integrations={platformIntegrations}
          onConfigure={configureIntegration}
        />
      )}
    </div>
  </div>
</div>
```

### **5. Analytics Dashboard** (`admin/src/pages/Analytics.jsx`)

```jsx
<div className="space-y-8">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Platform Analytics</h1>
      <p className="text-gray-600 mt-1">
        Comprehensive insights into platform performance
      </p>
    </div>

    <div className="flex items-center space-x-3">
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        presets={analyticsDatePresets}
      />

      <Button variant="outline" onClick={exportAnalyticsReport}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export Report
      </Button>

      <Button variant="outline" onClick={() => setShowCustomReport(true)}>
        <ChartBarIcon className="w-4 h-4 mr-2" />
        Custom Report
      </Button>
    </div>
  </div>

  {/* Key Performance Indicators */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <KPICard
      title="Total Revenue"
      value={formatCurrency(kpis.totalRevenue)}
      change={kpis.revenueChange}
      target={kpis.revenueTarget}
      icon={DollarSignIcon}
      color="green"
    />

    <KPICard
      title="Active Users"
      value={kpis.activeUsers.toLocaleString()}
      change={kpis.activeUsersChange}
      target={kpis.activeUsersTarget}
      icon={UsersIcon}
      color="blue"
    />

    <KPICard
      title="Course Completions"
      value={kpis.courseCompletions.toLocaleString()}
      change={kpis.completionsChange}
      target={kpis.completionsTarget}
      icon={TrophyIcon}
      color="yellow"
    />

    <KPICard
      title="Platform Usage"
      value={`${kpis.avgSessionDuration} min`}
      change={kpis.usageChange}
      target={kpis.usageTarget}
      icon={ClockIcon}
      color="purple"
    />
  </div>

  {/* Analytics Charts Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* User Growth */}
    <AnalyticsChart
      title="User Growth"
      subtitle="New registrations over time"
      type="line"
      data={userGrowthData}
      height={300}
    />

    {/* Revenue Trends */}
    <AnalyticsChart
      title="Revenue Trends"
      subtitle="Monthly revenue breakdown"
      type="area"
      data={revenueData}
      height={300}
    />

    {/* Course Performance */}
    <AnalyticsChart
      title="Course Performance"
      subtitle="Top performing courses by enrollment"
      type="bar"
      data={coursePerformanceData}
      height={300}
    />

    {/* User Engagement */}
    <AnalyticsChart
      title="User Engagement"
      subtitle="Daily active users and session duration"
      type="combo"
      data={engagementData}
      height={300}
    />
  </div>

  {/* Detailed Analytics Tables */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Top Courses */}
    <AnalyticsTable
      title="Top Performing Courses"
      columns={[
        { key: "title", header: "Course" },
        { key: "enrollments", header: "Enrollments" },
        { key: "completionRate", header: "Completion %" },
        { key: "revenue", header: "Revenue" },
      ]}
      data={topCourses}
    />

    {/* User Demographics */}
    <AnalyticsTable
      title="User Demographics"
      columns={[
        { key: "country", header: "Country" },
        { key: "users", header: "Users" },
        { key: "percentage", header: "Percentage" },
        { key: "growth", header: "Growth" },
      ]}
      data={userDemographics}
    />
  </div>

  {/* Geographic Analytics */}
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-lg font-semibold mb-4">Geographic Distribution</h2>
    <WorldMap data={geographicData} metric="activeUsers" colorScale="blues" />
  </div>

  {/* Custom Report Builder Modal */}
  <CustomReportModal
    isOpen={showCustomReport}
    onClose={() => setShowCustomReport(false)}
    onGenerate={generateCustomReport}
  />
</div>
```

### **6. Security & Monitoring** (`admin/src/pages/SecurityCenter.jsx`)

```jsx
<div className="space-y-8">
  {/* Security Status Overview */}
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="bg-red-600 px-6 py-4">
      <h1 className="text-2xl font-bold text-white">Security Center</h1>
      <p className="text-red-100 mt-1">Monitor and manage platform security</p>
    </div>

    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SecurityMetric
          title="Security Score"
          value={securityScore}
          maxValue={100}
          color={
            securityScore >= 80
              ? "green"
              : securityScore >= 60
              ? "yellow"
              : "red"
          }
          icon={ShieldCheckIcon}
        />

        <SecurityMetric
          title="Active Threats"
          value={securityMetrics.activeThreats}
          color={securityMetrics.activeThreats === 0 ? "green" : "red"}
          icon={ExclamationTriangleIcon}
        />

        <SecurityMetric
          title="Failed Logins (24h)"
          value={securityMetrics.failedLogins}
          color={securityMetrics.failedLogins < 10 ? "green" : "yellow"}
          icon={XCircleIcon}
        />

        <SecurityMetric
          title="Suspicious Activity"
          value={securityMetrics.suspiciousActivity}
          color={securityMetrics.suspiciousActivity === 0 ? "green" : "yellow"}
          icon={EyeIcon}
        />
      </div>
    </div>
  </div>

  {/* Security Alerts */}
  {securityAlerts.length > 0 && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-red-800 mb-4">
        Active Security Alerts ({securityAlerts.length})
      </h2>

      <div className="space-y-3">
        {securityAlerts.map((alert) => (
          <SecurityAlert
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
            onInvestigate={() => investigateAlert(alert.id)}
          />
        ))}
      </div>
    </div>
  )}

  {/* Security Monitoring Tabs */}
  <TabsContainer value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="grid w-full grid-cols-5">
      <TabsTrigger value="threats">Threat Detection</TabsTrigger>
      <TabsTrigger value="access">Access Control</TabsTrigger>
      <TabsTrigger value="audit">Audit Logs</TabsTrigger>
      <TabsTrigger value="firewall">Firewall Rules</TabsTrigger>
      <TabsTrigger value="backup">Backups</TabsTrigger>
    </TabsList>

    <TabsContent value="threats" className="space-y-6">
      <ThreatDetectionPanel
        threats={threatData}
        onBlockIP={blockIP}
        onWhitelistIP={whitelistIP}
      />
    </TabsContent>

    <TabsContent value="access" className="space-y-6">
      <AccessControlPanel
        sessions={activeSessions}
        onTerminateSession={terminateSession}
        onBanUser={banUser}
      />
    </TabsContent>

    <TabsContent value="audit" className="space-y-6">
      <AuditLogsTable
        logs={auditLogs}
        onExport={exportAuditLogs}
        onViewDetails={viewLogDetails}
      />
    </TabsContent>

    <TabsContent value="firewall" className="space-y-6">
      <FirewallRulesPanel
        rules={firewallRules}
        onAddRule={addFirewallRule}
        onEditRule={editFirewallRule}
        onDeleteRule={deleteFirewallRule}
      />
    </TabsContent>

    <TabsContent value="backup" className="space-y-6">
      <BackupManagementPanel
        backups={systemBackups}
        onCreateBackup={createBackup}
        onRestoreBackup={restoreBackup}
        onDeleteBackup={deleteBackup}
      />
    </TabsContent>
  </TabsContainer>
</div>
```

---

## 🔧 SYSTEM CONFIGURATION

### **Feature Toggle Panel**

```jsx
const FeatureTogglePanel = ({ features, onToggle }) => (
  <div className="space-y-6">
    {featureCategories.map((category) => (
      <div key={category.key} className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{category.label}</h3>
        </div>

        <div className="p-4 space-y-4">
          {category.features.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{feature.label}</div>
                <div className="text-sm text-gray-500">
                  {feature.description}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {feature.beta && <Badge variant="warning">Beta</Badge>}
                <Switch
                  checked={features[feature.key]}
                  onChange={(checked) => onToggle(feature.key, checked)}
                  disabled={feature.locked}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
```

### **Integration Management**

```jsx
const IntegrationsPanel = ({ integrations, onConfigure }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {availableIntegrations.map((integration) => (
      <IntegrationCard
        key={integration.key}
        integration={integration}
        status={integrations[integration.key]?.status}
        onConfigure={() => onConfigure(integration.key)}
        onTest={() => testIntegration(integration.key)}
        onDisable={() => disableIntegration(integration.key)}
      />
    ))}
  </div>
);
```

---

## 📊 MONITORING & ANALYTICS

### **Real-time System Monitoring**

```jsx
const SystemMonitor = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const ws = new WebSocket(`${process.env.VITE_WS_URL}/admin/monitor`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics((prev) => ({ ...prev, ...data }));
    };

    return () => ws.close();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <RealtimeChart
        title="CPU Usage"
        data={metrics.cpu}
        threshold={80}
        unit="%"
      />

      <RealtimeChart
        title="Memory Usage"
        data={metrics.memory}
        threshold={85}
        unit="%"
      />

      <RealtimeChart
        title="Active Connections"
        data={metrics.connections}
        unit="connections"
      />
    </div>
  );
};
```

### **Advanced Analytics Features**

- Custom report builder
- Scheduled reports
- Alert thresholds
- Data export capabilities
- Comparative analytics
- Predictive insights

---

## 🚨 ALERT SYSTEM

### **Alert Management**

```jsx
const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);

  const alertTypes = {
    security: { color: "red", icon: ShieldIcon },
    performance: { color: "yellow", icon: ZapIcon },
    system: { color: "blue", icon: ServerIcon },
    user: { color: "green", icon: UsersIcon },
  };

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          type={alert.type}
          severity={alert.severity}
          message={alert.message}
          timestamp={alert.timestamp}
          onDismiss={() => dismissAlert(alert.id)}
          onView={() => viewAlertDetails(alert.id)}
        />
      ))}
    </div>
  );
};
```

---

## 🔐 SECURITY FEATURES

### **Advanced Access Control**

- Role-based permissions
- IP whitelisting/blacklisting
- Multi-factor authentication
- Session management
- Audit trail logging

### **Threat Detection**

- Suspicious activity monitoring
- Rate limiting
- DDoS protection
- Malware scanning
- Content filtering

---

## 📈 PERFORMANCE OPTIMIZATION

### **Caching Strategy**

- Redis integration
- Query optimization
- CDN management
- Asset optimization

### **Scalability Monitoring**

- Database performance
- Server resource usage
- API response times
- Queue monitoring

Đây là plan thiết kế giao diện chi tiết cho Admin của MasterDev E-learning Platform, tập trung vào system management, security monitoring, user administration và comprehensive analytics để đảm bảo platform hoạt động hiệu quả và an toàn.
