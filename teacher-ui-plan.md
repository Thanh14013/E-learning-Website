# 🎓 TEACHER UI DESIGN PLAN - MasterDev E-learning Platform

> **Frontend Folder**: `frontend/src/`  
> **Target User**: Teachers/Giáo viên  
> **Tech Stack**: React + Context API + Socket.IO Client + WebRTC + Rich Text Editor

## 📋 MỤC LỤC

- [Tổng quan thiết kế](#-tổng-quan-thiết-kế)
- [Layout Structure](#-layout-structure)
- [Component Architecture](#-component-architecture)
- [Pages chi tiết](#-pages-chi-tiết)
- [Content Creation Tools](#-content-creation-tools)
- [Analytics & Reporting](#-analytics--reporting)
- [Real-time Features](#-real-time-features)

---

## 🎯 TỔNG QUAN THIẾT KẾ

### **Design System cho Teacher**

- **Color Scheme**:
  - Primary: `#7C3AED` (Purple) - Authority & Creativity
  - Secondary: `#059669` (Green) - Success & Growth
  - Accent: `#F59E0B` (Amber) - Attention & Highlights
  - Teacher-specific: `#8B5CF6` (Violet) - Teaching tools
- **Layout Priority**:
  - Content creation tools prominence
  - Analytics dashboard emphasis
  - Student management efficiency
  - Course organization clarity

---

## 🏗 LAYOUT STRUCTURE

### **Teacher Layout Component** (`components/common/TeacherLayout.jsx`)

```jsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <TeacherHeader />
  <div className="flex">
    <TeacherSidebar />
    <main className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb />
        <QuickActions />
      </div>
      {children}
    </main>
  </div>
  <TeacherFooter />
  <NotificationCenter />
  <SocketManager />
</div>
```

### **Teacher Header** (`components/teacher/TeacherHeader.jsx`)

**Desktop Layout:**

```
[Logo MasterDev] [Quick Create +] [Search Students/Courses] [Analytics] [Notifications] [Profile Menu]
```

**Components trong Header:**

- **Quick Create Button**:
  - Dropdown: New Course, New Quiz, Schedule Session, Bulk Upload
- **Search Bar**:
  - Multi-scope: Students, Courses, Content
  - Advanced filters
- **Analytics Quick View**:
  - Mini dashboard icon với hover stats
- **Notification Bell**:
  - Student submissions, Q&A, enrollments
- **Profile Menu**:
  - Teacher dashboard, Settings, Help center, Logout

### **Teacher Sidebar** (`components/teacher/TeacherSidebar.jsx`)

**Navigation Items:**

```jsx
const teacherNavigation = [
  { icon: DashboardIcon, label: "Dashboard", path: "/teacher/dashboard" },
  {
    icon: BookIcon,
    label: "My Courses",
    path: "/teacher/courses",
    children: [
      { label: "All Courses", path: "/teacher/courses" },
      { label: "Published", path: "/teacher/courses?status=published" },
      { label: "Drafts", path: "/teacher/courses?status=draft" },
      { label: "Create New", path: "/teacher/courses/create" },
    ],
  },
  {
    icon: UsersIcon,
    label: "Students",
    path: "/teacher/students",
    children: [
      { label: "All Students", path: "/teacher/students" },
      { label: "Performance", path: "/teacher/students/performance" },
      { label: "Certificates", path: "/teacher/students/certificates" },
    ],
  },
  { icon: QuizIcon, label: "Quizzes & Tests", path: "/teacher/quizzes" },
  { icon: VideoIcon, label: "Live Sessions", path: "/teacher/sessions" },
  { icon: ChatIcon, label: "Discussions", path: "/teacher/discussions" },
  { icon: ChartIcon, label: "Analytics", path: "/teacher/analytics" },
  { icon: SettingsIcon, label: "Settings", path: "/teacher/settings" },
];
```

**Sidebar Sections:**

1. **Main Navigation**
2. **Quick Stats Widget**:
   - Total students
   - Active courses
   - Avg. completion rate
   - This month earnings
3. **Recent Activities**
4. **Upcoming Sessions**

---

## 🧱 COMPONENT ARCHITECTURE

### **Content Creation Components**

#### **1. Course Builder** (`components/teacher/CourseBuilder.jsx`)

```jsx
<div className="max-w-6xl mx-auto">
  {/* Progress Steps */}
  <div className="mb-8">
    <StepIndicator
      steps={["Basic Info", "Curriculum", "Content", "Settings", "Preview"]}
      currentStep={currentStep}
    />
  </div>

  {/* Main Content */}
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Main Form */}
    <div className="lg:col-span-3">
      {currentStep === 0 && <BasicInfoForm />}
      {currentStep === 1 && <CurriculumBuilder />}
      {currentStep === 2 && <ContentUploader />}
      {currentStep === 3 && <CourseSettings />}
      {currentStep === 4 && <CoursePreview />}
    </div>

    {/* Sidebar Helper */}
    <div className="lg:col-span-1">
      <CourseBuilderSidebar
        currentStep={currentStep}
        courseData={courseData}
        onStepChange={setCurrentStep}
      />
    </div>
  </div>

  {/* Navigation */}
  <div className="flex items-center justify-between mt-8 pt-6 border-t">
    <Button
      variant="outline"
      onClick={previousStep}
      disabled={currentStep === 0}
    >
      Previous
    </Button>

    <div className="flex items-center space-x-3">
      <Button variant="ghost" onClick={saveDraft}>
        Save Draft
      </Button>
      <Button variant="primary" onClick={nextStep} disabled={!isStepValid}>
        {currentStep === 4 ? "Publish Course" : "Next"}
      </Button>
    </div>
  </div>
</div>
```

#### **2. Curriculum Builder** (`components/teacher/CurriculumBuilder.jsx`)

```jsx
<div className="space-y-6">
  {/* Drag & Drop Interface */}
  <DndProvider backend={HTML5Backend}>
    <div className="space-y-4">
      {chapters.map((chapter, chapterIndex) => (
        <div key={chapter.id} className="bg-white rounded-lg border">
          {/* Chapter Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <DragHandle />
              <div>
                <h3 className="font-semibold">{chapter.title}</h3>
                <p className="text-sm text-gray-500">
                  {chapter.lessons?.length || 0} lessons
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editChapter(chapter.id)}
              >
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteChapter(chapter.id)}
              >
                <DeleteIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lessons List */}
          <div className="p-4">
            <SortableList
              items={chapter.lessons || []}
              onSort={(sortedLessons) =>
                updateChapterLessons(chapter.id, sortedLessons)
              }
              renderItem={(lesson, lessonIndex) => (
                <LessonItem
                  lesson={lesson}
                  onEdit={() => editLesson(lesson.id)}
                  onDelete={() => deleteLesson(lesson.id)}
                  onDuplicate={() => duplicateLesson(lesson.id)}
                />
              )}
            />

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => addLesson(chapter.id)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </div>
        </div>
      ))}
    </div>
  </DndProvider>

  <Button variant="primary" onClick={addChapter} className="w-full">
    <PlusIcon className="w-4 h-4 mr-2" />
    Add New Chapter
  </Button>
</div>
```

#### **3. Rich Content Editor** (`components/teacher/RichEditor.jsx`)

```jsx
<div className="border rounded-lg overflow-hidden">
  {/* Toolbar */}
  <div className="bg-gray-50 border-b p-3">
    <div className="flex flex-wrap items-center gap-2">
      {/* Text Formatting */}
      <div className="flex items-center space-x-1 border-r pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </ToolbarButton>
      </div>

      {/* Headers */}
      <div className="flex items-center space-x-1 border-r pr-2">
        <HeadingSelect value={currentHeading} onChange={setHeading} />
      </div>

      {/* Lists */}
      <div className="flex items-center space-x-1 border-r pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <BulletListIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <NumberListIcon />
        </ToolbarButton>
      </div>

      {/* Media */}
      <div className="flex items-center space-x-1 border-r pr-2">
        <ToolbarButton onClick={insertImage}>
          <ImageIcon />
        </ToolbarButton>
        <ToolbarButton onClick={insertVideo}>
          <VideoIcon />
        </ToolbarButton>
        <ToolbarButton onClick={insertLink}>
          <LinkIcon />
        </ToolbarButton>
      </div>

      {/* Code */}
      <div className="flex items-center space-x-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeBlockIcon />
        </ToolbarButton>
      </div>
    </div>
  </div>

  {/* Editor Content */}
  <div className="min-h-[300px] p-4">
    <EditorContent
      editor={editor}
      className="prose prose-sm max-w-none focus:outline-none"
    />
  </div>

  {/* Footer */}
  <div className="bg-gray-50 border-t px-4 py-2 flex items-center justify-between">
    <div className="flex items-center space-x-4 text-sm text-gray-500">
      <span>{wordCount} words</span>
      <span>{characterCount} characters</span>
    </div>

    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="sm" onClick={togglePreview}>
        <EyeIcon className="w-4 h-4 mr-1" />
        Preview
      </Button>
      <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
        <ExpandIcon className="w-4 h-4 mr-1" />
        Fullscreen
      </Button>
    </div>
  </div>
</div>
```

---

## 📱 PAGES CHI TIẾT

### **1. Teacher Dashboard** (`pages/teacher/Dashboard.jsx`)

```jsx
<div className="space-y-8">
  {/* Welcome Section */}
  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {teacher.name}! 👨‍🏫</h1>
        <p className="text-purple-100 mt-2">
          You have {stats.activeStudents} students learning from your{" "}
          {stats.totalCourses} courses
        </p>
      </div>

      <div className="hidden lg:block">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.monthlyEarnings}</div>
            <div className="text-sm text-purple-100">This Month</div>
          </div>
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-4 mt-6">
      <Button
        variant="white"
        onClick={() => navigate("/teacher/courses/create")}
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Create New Course
      </Button>
      <Button
        variant="white-outline"
        onClick={() => navigate("/teacher/sessions/schedule")}
      >
        <VideoIcon className="w-4 h-4 mr-2" />
        Schedule Live Session
      </Button>
    </div>
  </div>

  {/* Quick Stats Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Total Students"
      value={stats.totalStudents}
      change={stats.studentsChange}
      icon={UsersIcon}
      color="blue"
    />
    <MetricCard
      title="Active Courses"
      value={stats.activeCourses}
      change={stats.coursesChange}
      icon={BookIcon}
      color="green"
    />
    <MetricCard
      title="Avg. Rating"
      value={stats.averageRating}
      change={stats.ratingChange}
      icon={StarIcon}
      color="yellow"
    />
    <MetricCard
      title="Completion Rate"
      value={`${stats.completionRate}%`}
      change={stats.completionChange}
      icon={TrophyIcon}
      color="purple"
    />
  </div>

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Recent Activity */}
    <div className="lg:col-span-2 space-y-6">
      <RecentCoursesWidget courses={recentCourses} />
      <StudentProgressWidget students={topStudents} />
    </div>

    {/* Sidebar Widgets */}
    <div className="space-y-6">
      <UpcomingSessionsWidget sessions={upcomingSessions} />
      <PendingQuestionsWidget questions={pendingQuestions} />
      <RevenueChartWidget data={revenueData} />
    </div>
  </div>

  {/* Performance Analytics */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <CoursePerformanceChart data={coursePerformance} />
    <StudentEngagementChart data={engagementData} />
  </div>
</div>
```

### **2. Course Management** (`pages/teacher/Courses.jsx`)

```jsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold">My Courses</h1>
      <p className="text-gray-600 mt-1">
        Manage your course content and track student progress
      </p>
    </div>

    <div className="flex items-center space-x-3 mt-4 md:mt-0">
      <Button variant="outline" onClick={handleBulkActions}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export Data
      </Button>
      <Button
        variant="primary"
        onClick={() => navigate("/teacher/courses/create")}
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Course
      </Button>
    </div>
  </div>

  {/* Filters & Search */}
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <SearchInput
          placeholder="Search courses..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <div className="flex items-center space-x-3">
        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "unpublished", label: "Unpublished" },
          ]}
        />

        <CategoryFilter
          value={categoryFilter}
          onChange={setCategoryFilter}
          categories={categories}
        />

        <SortSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "updated", label: "Last Updated" },
            { value: "created", label: "Date Created" },
            { value: "students", label: "Student Count" },
            { value: "rating", label: "Rating" },
          ]}
        />
      </div>
    </div>
  </div>

  {/* Course Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {coursesData.map((course) => (
      <TeacherCourseCard
        key={course.id}
        course={course}
        onEdit={() => navigate(`/teacher/courses/${course.id}/edit`)}
        onDuplicate={() => duplicateCourse(course.id)}
        onDelete={() => deleteCourse(course.id)}
        onViewAnalytics={() =>
          navigate(`/teacher/courses/${course.id}/analytics`)
        }
        onManageStudents={() =>
          navigate(`/teacher/courses/${course.id}/students`)
        }
      />
    ))}
  </div>

  {/* Empty State */}
  {coursesData.length === 0 && (
    <EmptyState
      icon={BookIcon}
      title="No courses found"
      description="Create your first course to get started with teaching on MasterDev"
      action={
        <Button
          variant="primary"
          onClick={() => navigate("/teacher/courses/create")}
        >
          Create Your First Course
        </Button>
      }
    />
  )}

  {/* Pagination */}
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
</div>
```

### **3. Student Management** (`pages/teacher/Students.jsx`)

```jsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Student Management</h1>
      <p className="text-gray-600 mt-1">
        Monitor student progress and engagement
      </p>
    </div>

    <div className="flex items-center space-x-3">
      <Button variant="outline" onClick={exportStudentData}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" onClick={sendBulkMessage}>
        <MailIcon className="w-4 h-4 mr-2" />
        Message Students
      </Button>
    </div>
  </div>

  {/* Stats Overview */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard
      title="Total Students"
      value={studentStats.total}
      icon={UsersIcon}
    />
    <StatCard
      title="Active This Week"
      value={studentStats.activeWeek}
      icon={TrendingUpIcon}
    />
    <StatCard
      title="Avg. Progress"
      value={`${studentStats.avgProgress}%`}
      icon={ChartBarIcon}
    />
    <StatCard
      title="Completion Rate"
      value={`${studentStats.completionRate}%`}
      icon={CheckCircleIcon}
    />
  </div>

  {/* Filters */}
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex flex-col md:flex-row gap-4">
      <SearchInput
        placeholder="Search students..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <CourseFilter
        value={courseFilter}
        onChange={setCourseFilter}
        courses={teacherCourses}
      />

      <ProgressFilter value={progressFilter} onChange={setProgressFilter} />

      <StatusFilter value={statusFilter} onChange={setStatusFilter} />
    </div>
  </div>

  {/* Students Table */}
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedStudents.length === studentsData.length}
              onChange={toggleSelectAll}
            />
          </TableHead>
          <TableHead>Student</TableHead>
          <TableHead>Enrolled Courses</TableHead>
          <TableHead>Overall Progress</TableHead>
          <TableHead>Last Activity</TableHead>
          <TableHead>Quiz Average</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {studentsData.map((student) => (
          <TableRow key={student.id}>
            <TableCell>
              <Checkbox
                checked={selectedStudents.includes(student.id)}
                onChange={() => toggleSelectStudent(student.id)}
              />
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-3">
                <Avatar src={student.avatar} name={student.name} />
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-2">
                <span>{student.enrolledCourses.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewStudentCourses(student.id)}
                >
                  View
                </Button>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-2">
                <ProgressBar
                  progress={student.overallProgress}
                  className="w-16"
                />
                <span className="text-sm">{student.overallProgress}%</span>
              </div>
            </TableCell>

            <TableCell>
              <div className="text-sm">
                <div>{formatDate(student.lastActivity)}</div>
                <div className="text-gray-500">
                  {getRelativeTime(student.lastActivity)}
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span>{student.quizAverage}%</span>
              </div>
            </TableCell>

            <TableCell>
              <StatusBadge status={student.status} />
            </TableCell>

            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontalIcon className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => viewStudentProfile(student.id)}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => messageStudent(student.id)}>
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => viewStudentProgress(student.id)}
                  >
                    View Progress
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => generateCertificate(student.id)}
                  >
                    Generate Certificate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Bulk Actions Bar */}
    {selectedStudents.length > 0 && (
      <div className="bg-blue-50 border-t px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedStudents.length} student(s) selected
          </span>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={sendBulkMessage}>
              Send Message
            </Button>
            <Button variant="outline" size="sm" onClick={exportSelected}>
              Export Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateBulkCertificates}
            >
              Generate Certificates
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>

  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
</div>
```

### **4. Quiz Builder** (`pages/teacher/QuizBuilder.jsx`)

```jsx
<div className="max-w-6xl mx-auto space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Quiz Builder</h1>
      <p className="text-gray-600 mt-1">
        Create engaging quizzes for your students
      </p>
    </div>

    <div className="flex items-center space-x-3">
      <Button variant="outline" onClick={previewQuiz}>
        <EyeIcon className="w-4 h-4 mr-2" />
        Preview
      </Button>
      <Button variant="outline" onClick={saveDraft}>
        Save Draft
      </Button>
      <Button variant="primary" onClick={publishQuiz}>
        Publish Quiz
      </Button>
    </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Main Editor */}
    <div className="lg:col-span-3 space-y-6">
      {/* Quiz Settings */}
      <QuizSettingsPanel quiz={quizData} onChange={updateQuizData} />

      {/* Questions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {questions.length} question(s)
              </span>
              <QuestionTypeSelector onSelect={addQuestion} />
            </div>
          </div>
        </div>

        <div className="divide-y">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updatedQuestion) =>
                updateQuestion(index, updatedQuestion)
              }
              onDelete={() => deleteQuestion(index)}
              onDuplicate={() => duplicateQuestion(index)}
              onMove={(from, to) => moveQuestion(from, to)}
            />
          ))}

          {questions.length === 0 && (
            <div className="p-8 text-center">
              <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No questions yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start building your quiz by adding your first question
              </p>
              <QuestionTypeSelector onSelect={addQuestion} />
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Sidebar */}
    <div className="lg:col-span-1 space-y-6">
      {/* Quiz Overview */}
      <QuizOverviewCard quiz={quizData} questions={questions} />

      {/* Question Bank */}
      <QuestionBankWidget
        onImportQuestion={importQuestion}
        onSaveToBank={saveQuestionToBank}
      />

      {/* Quiz Templates */}
      <QuizTemplatesWidget onLoadTemplate={loadTemplate} />
    </div>
  </div>
</div>
```

### **5. Live Session Management** (`pages/teacher/LiveSessions.jsx`)

```jsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Live Sessions</h1>
      <p className="text-gray-600 mt-1">
        Schedule and manage your live teaching sessions
      </p>
    </div>

    <Button
      variant="primary"
      onClick={() => navigate("/teacher/sessions/schedule")}
    >
      <PlusIcon className="w-4 h-4 mr-2" />
      Schedule Session
    </Button>
  </div>

  {/* Quick Stats */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard
      title="This Week"
      value={sessionStats.thisWeek}
      icon={CalendarIcon}
    />
    <StatCard
      title="Total Sessions"
      value={sessionStats.total}
      icon={VideoIcon}
    />
    <StatCard
      title="Avg. Attendance"
      value={`${sessionStats.avgAttendance}%`}
      icon={UsersIcon}
    />
    <StatCard
      title="Recordings"
      value={sessionStats.recordings}
      icon={FilmIcon}
    />
  </div>

  {/* Calendar View Toggle */}
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <ViewToggle
        views={["list", "calendar"]}
        currentView={view}
        onViewChange={setView}
      />

      <DateRangePicker value={dateRange} onChange={setDateRange} />
    </div>

    <div className="flex items-center space-x-2">
      <StatusFilter
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: "all", label: "All Sessions" },
          { value: "scheduled", label: "Scheduled" },
          { value: "live", label: "Live" },
          { value: "ended", label: "Ended" },
        ]}
      />
    </div>
  </div>

  {view === "calendar" ? (
    <SessionCalendar
      sessions={sessionsData}
      onSessionClick={handleSessionClick}
      onDateClick={handleDateClick}
    />
  ) : (
    <div className="space-y-4">
      {sessionsData.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onEdit={() => navigate(`/teacher/sessions/${session.id}/edit`)}
          onStart={() => startSession(session.id)}
          onJoin={() => joinSession(session.id)}
          onEnd={() => endSession(session.id)}
          onDelete={() => deleteSession(session.id)}
          onViewRecording={() => viewRecording(session.id)}
          onViewAnalytics={() => viewSessionAnalytics(session.id)}
        />
      ))}
    </div>
  )}
</div>
```

### **6. Analytics Dashboard** (`pages/teacher/Analytics.jsx`)

```jsx
<div className="space-y-8">
  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      <p className="text-gray-600 mt-1">
        Track your teaching performance and student engagement
      </p>
    </div>

    <div className="flex items-center space-x-3 mt-4 md:mt-0">
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        presets={[
          { label: "Last 7 days", value: "last7days" },
          { label: "Last 30 days", value: "last30days" },
          { label: "Last 3 months", value: "last3months" },
          { label: "This year", value: "thisyear" },
        ]}
      />

      <Button variant="outline" onClick={exportAnalytics}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Export Report
      </Button>
    </div>
  </div>

  {/* Key Metrics */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Total Revenue"
      value={formatCurrency(metrics.totalRevenue)}
      change={metrics.revenueChange}
      icon={DollarSignIcon}
      color="green"
    />
    <MetricCard
      title="New Students"
      value={metrics.newStudents}
      change={metrics.studentsChange}
      icon={UserPlusIcon}
      color="blue"
    />
    <MetricCard
      title="Course Completions"
      value={metrics.completions}
      change={metrics.completionsChange}
      icon={TrophyIcon}
      color="yellow"
    />
    <MetricCard
      title="Avg. Rating"
      value={metrics.averageRating}
      change={metrics.ratingChange}
      icon={StarIcon}
      color="purple"
    />
  </div>

  {/* Charts Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Revenue Chart */}
    <ChartCard
      title="Revenue Over Time"
      subtitle="Monthly revenue breakdown"
      chart={
        <LineChart
          data={revenueData}
          xAxisKey="month"
          lines={[{ key: "revenue", color: "#10B981", name: "Revenue" }]}
        />
      }
    />

    {/* Student Enrollment */}
    <ChartCard
      title="Student Enrollment"
      subtitle="New students per course"
      chart={
        <BarChart
          data={enrollmentData}
          xAxisKey="course"
          bars={[{ key: "students", color: "#3B82F6", name: "Students" }]}
        />
      }
    />

    {/* Course Performance */}
    <ChartCard
      title="Course Performance"
      subtitle="Completion rates by course"
      chart={
        <HorizontalBarChart
          data={coursePerformanceData}
          yAxisKey="course"
          bars={[
            { key: "completionRate", color: "#8B5CF6", name: "Completion %" },
          ]}
        />
      }
    />

    {/* Engagement Metrics */}
    <ChartCard
      title="Student Engagement"
      subtitle="Weekly active students"
      chart={
        <AreaChart
          data={engagementData}
          xAxisKey="week"
          areas={[
            {
              key: "activeStudents",
              color: "#F59E0B",
              name: "Active Students",
            },
          ]}
        />
      }
    />
  </div>

  {/* Detailed Tables */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Top Performing Courses */}
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Top Performing Courses</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {topCourses.map((course, index) => (
            <TableRow key={course.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-gray-500">
                      {course.category}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{course.studentCount}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <ProgressBar
                    progress={course.completionRate}
                    className="w-16"
                  />
                  <span className="text-sm">{course.completionRate}%</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span>{course.rating}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Recent Student Activity */}
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Recent Student Activity</h3>
      </div>

      <div className="divide-y max-h-80 overflow-y-auto">
        {recentActivity.map((activity, index) => (
          <div key={index} className="p-4 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <Avatar
                src={activity.student.avatar}
                name={activity.student.name}
                size="sm"
              />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.student.name}</span>{" "}
                  {activity.action}{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {getRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

---

## 🛠 CONTENT CREATION TOOLS

### **Video Upload & Processing**

```jsx
const VideoUploader = ({ onUploadComplete }) => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
    <div className="text-center">
      <CloudUploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">Upload Video Content</h3>
      <p className="text-gray-500 mb-4">
        Support formats: MP4, AVI, MOV (Max: 2GB)
      </p>

      <input
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
        ref={fileInputRef}
      />

      <Button onClick={() => fileInputRef.current?.click()}>
        Select Video File
      </Button>
    </div>

    {uploading && (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Uploading...</span>
          <span className="text-sm text-gray-500">{uploadProgress}%</span>
        </div>
        <ProgressBar progress={uploadProgress} />
      </div>
    )}
  </div>
);
```

### **Bulk Content Import**

```jsx
const BulkImporter = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Bulk Content Import</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImportOption
          icon={FileTextIcon}
          title="CSV Import"
          description="Import course structure from CSV"
          onClick={() => setImportType("csv")}
        />

        <ImportOption
          icon={FolderIcon}
          title="Zip Archive"
          description="Upload zip with videos & materials"
          onClick={() => setImportType("zip")}
        />

        <ImportOption
          icon={LinkIcon}
          title="From URL"
          description="Import from existing course platforms"
          onClick={() => setImportType("url")}
        />
      </div>
    </div>

    {importType && (
      <ImportWizard
        type={importType}
        onComplete={handleImportComplete}
        onCancel={() => setImportType(null)}
      />
    )}
  </div>
);
```

---

## 📊 ANALYTICS & REPORTING

### **Performance Metrics**

- Student enrollment trends
- Course completion rates
- Quiz performance analytics
- Engagement time tracking
- Revenue analytics
- Student feedback analysis

### **Automated Reports**

- Weekly performance summary
- Monthly revenue report
- Student progress alerts
- Course performance insights

---

## ⚡ REAL-TIME FEATURES

### **Live Session Management**

- WebRTC video conferencing
- Screen sharing capabilities
- Interactive whiteboard
- Real-time chat
- Participant management
- Session recording

### **Real-time Notifications**

```jsx
const useTeacherNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (socket) {
      // Student enrollments
      socket.on("student:enrolled", (data) => {
        showNotification(`${data.studentName} enrolled in ${data.courseName}`);
      });

      // Quiz submissions
      socket.on("quiz:submitted", (data) => {
        showNotification(`New quiz submission from ${data.studentName}`);
      });

      // Q&A questions
      socket.on("question:asked", (data) => {
        showNotification(`New question in ${data.courseName}`);
      });
    }
  }, [socket]);
};
```

### **Collaborative Features**

- Real-time course editing
- Live student Q&A
- Instant feedback system
- Collaborative whiteboard

---

## 🎨 TEACHER-SPECIFIC UI PATTERNS

### **Progressive Disclosure**

- Collapsed sidebar cho mobile
- Expandable course sections
- Collapsible analytics widgets

### **Batch Operations**

- Bulk student messaging
- Mass grade assignment
- Batch certificate generation

### **Workflow Optimization**

- Quick action buttons
- Keyboard shortcuts
- Template system
- Auto-save functionality

Đây là plan thiết kế giao diện chi tiết cho Teacher của MasterDev E-learning Platform, với focus vào productivity tools, content creation capabilities và analytics dashboard để giúp giáo viên quản lý và giảng dạy hiệu quả.
