# 🎓 STUDENT UI DESIGN PLAN - MasterDev E-learning Platform

> **Frontend Folder**: `frontend/src/`  
> **Target User**: Students/Học viên  
> **Tech Stack**: React + Context API + Socket.IO Client + WebRTC

## 📋 MỤC LỤC

- [Tổng quan thiết kế](#-tổng-quan-thiết-kế)
- [Layout Structure](#-layout-structure)
- [Component Architecture](#-component-architecture)
- [Pages chi tiết](#-pages-chi-tiết)
- [Responsive Design](#-responsive-design)
- [State Management](#-state-management)
- [Real-time Features](#-real-time-features)

---

## 🎯 TỔNG QUAN THIẾT KẾ

### **Design System**

- **Color Scheme**:
  - Primary: `#4F46E5` (Indigo)
  - Secondary: `#059669` (Green)
  - Accent: `#F59E0B` (Amber)
  - Error: `#DC2626` (Red)
  - Success: `#10B981` (Emerald)
- **Typography**:

  - Headers: `Inter Bold`
  - Body: `Inter Regular`
  - Code: `Fira Code`

- **Spacing**: 8px grid system (8px, 16px, 24px, 32px, 48px, 64px)

---

## 🏗 LAYOUT STRUCTURE

### **Main Layout Component** (`components/common/StudentLayout.jsx`)

```jsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <StudentHeader />
  <div className="flex">
    <StudentSidebar />
    <main className="flex-1 p-6">
      <Breadcrumb />
      {children}
    </main>
  </div>
  <StudentFooter />
  <NotificationToast />
  <SocketManager />
</div>
```

### **Header Component** (`components/student/StudentHeader.jsx`)

**Desktop Layout:**

```
[Logo MasterDev] [Search Bar] [Notifications] [Profile Menu]
```

**Components trong Header:**

- **Logo**: Link về dashboard
- **Search Bar**:
  - Placeholder: "Tìm kiếm khóa học..."
  - Auto-complete suggestions
  - Recent searches
- **Notification Bell**:
  - Unread count badge
  - Dropdown với 5 notifications gần nhất
  - "View all" link
- **Profile Menu**:
  - Avatar + tên
  - Dropdown: Profile, Settings, Help, Logout

**Responsive:**

- Mobile: Logo + Hamburger menu
- Tablet: Collapsed search + icons

### **Sidebar Component** (`components/student/StudentSidebar.jsx`)

**Navigation Items:**

```jsx
const navigationItems = [
  { icon: HomeIcon, label: "Dashboard", path: "/dashboard" },
  { icon: BookIcon, label: "My Courses", path: "/my-courses" },
  { icon: SearchIcon, label: "Browse Courses", path: "/courses" },
  { icon: PlayIcon, label: "Continue Learning", path: "/continue-learning" },
  { icon: ChatIcon, label: "Discussions", path: "/discussions" },
  { icon: VideoIcon, label: "Live Sessions", path: "/live-sessions" },
  { icon: TrophyIcon, label: "Achievements", path: "/achievements" },
  { icon: UserIcon, label: "Profile", path: "/profile" },
];
```

**Sidebar Sections:**

1. **Main Navigation** (above items)
2. **Recent Courses** (3 gần nhất)
3. **Quick Stats** (Progress ring, completed courses)

---

## 🧱 COMPONENT ARCHITECTURE

### **Common Components** (`components/common/`)

#### **1. CourseCard Component**

```jsx
<div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
  <div className="relative">
    <img
      src={course.thumbnail}
      alt={course.title}
      className="w-full h-48 object-cover"
    />
    <div className="absolute top-2 right-2">
      <Badge variant={course.level} />
    </div>
    <div className="absolute bottom-2 left-2">
      <ProgressRing progress={course.progress} size="sm" />
    </div>
  </div>

  <div className="p-4">
    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
    <p className="text-gray-600 text-sm mb-3">{course.description}</p>

    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center">
        <Avatar src={course.teacher.avatar} size="xs" />
        <span className="ml-2 text-sm">{course.teacher.name}</span>
      </div>
      <div className="flex items-center">
        <StarIcon className="w-4 h-4 text-yellow-400" />
        <span className="ml-1 text-sm">{course.rating}</span>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">
        {course.completedLessons}/{course.totalLessons} lessons
      </span>
      <Button variant="primary" size="sm">
        Continue
      </Button>
    </div>
  </div>
</div>
```

#### **2. VideoPlayer Component**

```jsx
<div className="relative bg-black rounded-lg overflow-hidden">
  <video
    ref={videoRef}
    className="w-full h-full"
    controls
    onTimeUpdate={handleTimeUpdate}
    onEnded={handleVideoEnded}
  >
    <source src={videoUrl} type="video/mp4" />
  </video>

  {/* Custom Controls Overlay */}
  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4">
    <div className="flex items-center justify-between text-white">
      <div className="flex items-center space-x-4">
        <button onClick={togglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <select value={playbackSpeed} onChange={handleSpeedChange}>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
        <button onClick={toggleFullscreen}>
          <ExpandIcon />
        </button>
      </div>
    </div>

    <ProgressBar progress={(currentTime / duration) * 100} />
  </div>

  {/* Notes Panel */}
  <div className="absolute top-4 right-4">
    <button
      onClick={toggleNotes}
      className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full"
    >
      <NotesIcon />
    </button>
  </div>
</div>
```

#### **3. QuizQuestion Component**

```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
        Question {currentQuestion + 1} of {totalQuestions}
      </span>
    </div>
    <div className="flex items-center text-sm text-gray-500">
      <ClockIcon className="w-4 h-4 mr-1" />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  </div>

  <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

  <div className="space-y-3">
    {question.options.map((option, index) => (
      <label
        key={index}
        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
      >
        <input
          type="radio"
          name="answer"
          value={option.id}
          checked={selectedAnswer === option.id}
          onChange={() => setSelectedAnswer(option.id)}
          className="mr-3"
        />
        <span>{option.text}</span>
      </label>
    ))}
  </div>

  <div className="flex items-center justify-between mt-6">
    <Button
      variant="secondary"
      onClick={previousQuestion}
      disabled={currentQuestion === 0}
    >
      Previous
    </Button>

    <Button variant="primary" onClick={nextQuestion} disabled={!selectedAnswer}>
      {currentQuestion === totalQuestions - 1 ? "Submit" : "Next"}
    </Button>
  </div>
</div>
```

---

## 📱 PAGES CHI TIẾT

### **1. Authentication Pages**

#### **Login Page** (`pages/student/Login.jsx`)

```jsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
  <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
    {/* Logo */}
    <div className="text-center">
      <h1 className="text-3xl font-bold text-indigo-600">MasterDev</h1>
      <p className="text-gray-600 mt-2">Welcome back, learner!</p>
    </div>

    {/* Form */}
    <form onSubmit={handleLogin} className="space-y-6">
      <Input
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input type="checkbox" className="rounded" />
          <span className="ml-2 text-sm">Remember me</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-sm text-indigo-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={loading}
      >
        Sign In
      </Button>
    </form>

    {/* Divider */}
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">Or continue with</span>
      </div>
    </div>

    {/* Social Login */}
    <div className="grid grid-cols-2 gap-3">
      <Button variant="outline" onClick={googleLogin}>
        <GoogleIcon className="w-5 h-5 mr-2" />
        Google
      </Button>
      <Button variant="outline" onClick={facebookLogin}>
        <FacebookIcon className="w-5 h-5 mr-2" />
        Facebook
      </Button>
    </div>

    {/* Register Link */}
    <p className="text-center text-sm">
      Don't have an account?{" "}
      <Link to="/register" className="text-indigo-600 hover:underline">
        Sign up
      </Link>
    </p>
  </div>
</div>
```

### **2. Student Dashboard** (`pages/student/Dashboard.jsx`)

```jsx
<div className="space-y-6">
  {/* Welcome Section */}
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
    <h1 className="text-2xl font-bold">Welcome back, {user.fullName}! 👋</h1>
    <p className="mt-2">Ready to continue your learning journey?</p>
  </div>

  {/* Quick Stats */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <StatCard
      title="Enrolled Courses"
      value={stats.enrolledCourses}
      icon={BookIcon}
      color="blue"
    />
    <StatCard
      title="Completed Lessons"
      value={stats.completedLessons}
      icon={CheckIcon}
      color="green"
    />
    <StatCard
      title="Quiz Average"
      value={`${stats.quizAverage}%`}
      icon={TrophyIcon}
      color="yellow"
    />
    <StatCard
      title="Learning Hours"
      value={stats.learningHours}
      icon={ClockIcon}
      color="purple"
    />
  </div>

  {/* Continue Learning */}
  <div>
    <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {continueCoursesData.map((course) => (
        <CourseCard key={course.id} course={course} showProgress />
      ))}
    </div>
  </div>

  {/* Recent Activities */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
      <ActivityTimeline activities={recentActivities} />
    </div>

    <div>
      <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
      <UpcomingSessionsList sessions={upcomingSessions} />
    </div>
  </div>

  {/* Recommended Courses */}
  <div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">Recommended for You</h2>
      <Link to="/courses" className="text-indigo-600 hover:underline">
        View all
      </Link>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {recommendedCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  </div>
</div>
```

### **3. Course Listing** (`pages/student/Courses.jsx`)

```jsx
<div className="space-y-6">
  {/* Page Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold">Browse Courses</h1>
      <p className="text-gray-600 mt-1">
        Discover new skills and advance your career
      </p>
    </div>

    <div className="mt-4 md:mt-0 flex items-center space-x-4">
      <ViewToggle view={view} onViewChange={setView} />
      <SortSelect value={sortBy} onChange={setSortBy} />
    </div>
  </div>

  {/* Filters */}
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex flex-wrap items-center gap-4">
      <SearchInput
        placeholder="Search courses..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <LevelFilter
        levels={levels}
        selected={selectedLevel}
        onSelect={setSelectedLevel}
      />

      <PriceFilter priceRange={priceRange} onRangeChange={setPriceRange} />

      <RatingFilter minRating={minRating} onRatingChange={setMinRating} />
    </div>

    {hasActiveFilters && (
      <div className="mt-4 flex items-center justify-between">
        <ActiveFilters filters={activeFilters} onRemove={removeFilter} />
        <Button variant="ghost" onClick={clearAllFilters}>
          Clear all
        </Button>
      </div>
    )}
  </div>

  {/* Results */}
  <div className="flex items-center justify-between">
    <p className="text-gray-600">{coursesData.length} courses found</p>
    <EnrollmentFilter
      filter={enrollmentFilter}
      onChange={setEnrollmentFilter}
    />
  </div>

  {/* Course Grid/List */}
  <div
    className={
      view === "grid"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
    }
  >
    {coursesData.map((course) =>
      view === "grid" ? (
        <CourseCard key={course.id} course={course} />
      ) : (
        <CourseListItem key={course.id} course={course} />
      )
    )}
  </div>

  {/* Pagination */}
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
</div>
```

### **4. Course Detail** (`pages/student/CourseDetail.jsx`)

```jsx
<div className="space-y-8">
  {/* Hero Section */}
  <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg overflow-hidden">
    <div className="flex flex-col lg:flex-row">
      <div className="lg:w-2/3 p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <CategoryBadge category={course.category} />
          <LevelBadge level={course.level} />
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{course.title}</h1>
        <p className="text-lg text-gray-300 mb-6">{course.description}</p>

        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="flex items-center">
            <Avatar src={course.teacher.avatar} />
            <div className="ml-3">
              <p className="font-semibold">{course.teacher.name}</p>
              <p className="text-sm text-gray-400">{course.teacher.title}</p>
            </div>
          </div>

          <div className="flex items-center">
            <StarRating rating={course.rating} />
            <span className="ml-2">({course.totalReviews} reviews)</span>
          </div>

          <div className="flex items-center text-sm">
            <UsersIcon className="w-4 h-4 mr-1" />
            <span>{course.enrolledStudents} students</span>
          </div>

          <div className="flex items-center text-sm">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{course.duration} total hours</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isEnrolled ? (
            <Button size="lg" onClick={continueLearning}>
              Continue Learning
            </Button>
          ) : (
            <Button size="lg" onClick={enrollCourse}>
              Enroll Now
            </Button>
          )}

          <Button variant="outline" size="lg" onClick={toggleWishlist}>
            <HeartIcon
              className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
            />
            Wishlist
          </Button>
        </div>
      </div>

      <div className="lg:w-1/3 p-8">
        <div className="bg-white rounded-lg p-6">
          <VideoPreview
            videoUrl={course.previewVideo}
            thumbnail={course.thumbnail}
          />

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Includes:</span>
            </div>
            <IncludesList items={course.includes} />
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Content Tabs */}
  <TabsContainer defaultTab="curriculum">
    <TabsList>
      <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
      <TabsTrigger value="reviews">Reviews</TabsTrigger>
      <TabsTrigger value="instructor">Instructor</TabsTrigger>
      <TabsTrigger value="discussions">Discussions</TabsTrigger>
    </TabsList>

    <TabsContent value="curriculum">
      <CourseCurriculum
        chapters={course.chapters}
        isEnrolled={isEnrolled}
        userProgress={userProgress}
      />
    </TabsContent>

    <TabsContent value="reviews">
      <CourseReviews
        reviews={course.reviews}
        averageRating={course.rating}
        totalReviews={course.totalReviews}
        canReview={isEnrolled && !hasReviewed}
        onAddReview={handleAddReview}
      />
    </TabsContent>

    <TabsContent value="instructor">
      <InstructorProfile
        instructor={course.teacher}
        courses={instructorCourses}
      />
    </TabsContent>

    <TabsContent value="discussions">
      <CourseDiscussions courseId={course.id} canPost={isEnrolled} />
    </TabsContent>
  </TabsContainer>

  {/* Related Courses */}
  <div>
    <h2 className="text-2xl font-bold mb-6">Related Courses</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  </div>
</div>
```

### **5. Lesson Player** (`pages/student/LessonPlayer.jsx`)

```jsx
<div className="min-h-screen bg-gray-900">
  {/* Header */}
  <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link
          to={`/courses/${courseId}`}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-white font-semibold">{lesson.title}</h1>
          <p className="text-gray-400 text-sm">
            {course.title} • Chapter {chapter.order}: {chapter.title}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LessonNavigation
          currentLessonId={lessonId}
          lessons={allLessons}
          onLessonChange={handleLessonChange}
        />
        <ProgressIndicator progress={lessonProgress} />
      </div>
    </div>
  </div>

  <div className="flex h-[calc(100vh-80px)]">
    {/* Video Player */}
    <div className="flex-1 flex flex-col">
      <div className="flex-1 bg-black flex items-center justify-center">
        <VideoPlayer
          videoUrl={lesson.videoUrl}
          onProgress={handleVideoProgress}
          onComplete={handleVideoComplete}
          initialTime={userProgress.watchedDuration}
        />
      </div>

      {/* Lesson Content */}
      <div className="bg-white p-6 max-h-60 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={toggleNotes}>
              <NotesIcon className="w-4 h-4" />
              Notes
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTranscript}>
              <TranscriptIcon className="w-4 h-4" />
              Transcript
            </Button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>

        {lesson.resources.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Resources</h3>
            <ResourcesList resources={lesson.resources} />
          </div>
        )}
      </div>
    </div>

    {/* Sidebar */}
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <TabsContainer defaultTab="curriculum">
        <TabsList className="bg-gray-50">
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="flex-1 overflow-y-auto">
          <LessonCurriculum
            chapters={course.chapters}
            currentLessonId={lessonId}
            userProgress={userProgress}
            onLessonClick={handleLessonChange}
          />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-y-auto">
          <LessonNotes
            lessonId={lessonId}
            notes={userNotes}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
          />
        </TabsContent>

        <TabsContent value="qa" className="flex-1 overflow-y-auto">
          <LessonQA
            lessonId={lessonId}
            questions={lessonQuestions}
            onAskQuestion={handleAskQuestion}
          />
        </TabsContent>
      </TabsContainer>
    </div>
  </div>

  {/* Lesson Navigation Footer */}
  <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={goToPreviousLesson}
        disabled={!previousLesson}
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Previous Lesson
      </Button>

      <div className="flex items-center space-x-4">
        <Button
          variant={isCompleted ? "success" : "secondary"}
          onClick={toggleLessonCompletion}
        >
          {isCompleted ? (
            <>
              <CheckIcon className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            "Mark as Complete"
          )}
        </Button>

        <Button
          variant="primary"
          onClick={goToNextLesson}
          disabled={!nextLesson}
        >
          Next Lesson
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  </div>
</div>
```

### **6. Quiz Taking Interface** (`pages/student/TakeQuiz.jsx`)

```jsx
<div className="min-h-screen bg-gray-50">
  {/* Quiz Header */}
  <div className="bg-white shadow-sm border-b px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{quiz.title}</h1>
        <p className="text-gray-600 text-sm">{course.title}</p>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm text-gray-600">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>

        <div className="flex items-center text-sm">
          <ClockIcon className="w-4 h-4 mr-1 text-orange-500" />
          <span
            className={`font-mono ${
              timeRemaining < 300 ? "text-red-600" : "text-gray-700"
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
    </div>

    <div className="mt-4">
      <ProgressBar
        progress={(currentQuestion / quiz.questions.length) * 100}
        className="h-2"
      />
    </div>
  </div>

  <div className="max-w-4xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Question Area */}
      <div className="lg:col-span-3">
        <QuestionCard
          question={currentQuestionData}
          answer={answers[currentQuestion]}
          onAnswerChange={handleAnswerChange}
          showExplanation={false}
        />

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={flagQuestion}>
              <FlagIcon
                className={`w-4 h-4 mr-2 ${
                  flaggedQuestions.includes(currentQuestion)
                    ? "text-red-500"
                    : ""
                }`}
              />
              {flaggedQuestions.includes(currentQuestion) ? "Unflag" : "Flag"}
            </Button>

            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setShowSubmitModal(true)}
                disabled={!allQuestionsAnswered}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button variant="primary" onClick={goToNextQuestion}>
                Next
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
          <h3 className="font-semibold mb-4">Question Navigator</h3>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  w-8 h-8 rounded text-xs font-medium
                  ${
                    index === currentQuestion
                      ? "bg-blue-600 text-white"
                      : answers[index]
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }
                  ${
                    flaggedQuestions.includes(index)
                      ? "ring-2 ring-red-400"
                      : ""
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Answered:</span>
              <span className="font-medium">
                {answeredCount}/{quiz.questions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Flagged:</span>
              <span className="font-medium text-red-600">
                {flaggedQuestions.length}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-2">Legend:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                Current
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                Answered
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
                Not answered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Submit Confirmation Modal */}
  <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)}>
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Quiz</h3>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Are you sure you want to submit your quiz? Once submitted, you cannot
          make changes.
        </p>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Questions:</span>
              <span className="font-medium ml-2">{quiz.questions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Answered:</span>
              <span className="font-medium ml-2">{answeredCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Flagged:</span>
              <span className="font-medium ml-2">
                {flaggedQuestions.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Time Used:</span>
              <span className="font-medium ml-2">
                {formatTime(quiz.duration * 60 - timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You have {unansweredCount} unanswered question(s). They will be
                marked as incorrect.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3">
        <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
          Review Again
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmitQuiz}
          loading={submitting}
        >
          Submit Quiz
        </Button>
      </div>
    </div>
  </Modal>

  {/* Auto-save Indicator */}
  <div className="fixed bottom-4 right-4">
    <div
      className={`
      px-3 py-1 rounded-full text-sm transition-opacity
      ${
        isAutoSaving
          ? "bg-blue-100 text-blue-800 opacity-100"
          : "bg-green-100 text-green-800 opacity-50"
      }
    `}
    >
      {isAutoSaving ? "Saving..." : "Saved"}
    </div>
  </div>
</div>
```

### **7. Live Session Room** (`pages/student/LiveSession.jsx`)

```jsx
<div className="h-screen bg-gray-900 flex flex-col">
  {/* Session Header */}
  <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-white font-semibold">{session.title}</h1>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400 text-sm">LIVE</span>
        </div>
        <div className="text-gray-400 text-sm">
          {participantCount} participants
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={toggleSettings}>
          <SettingsIcon className="w-4 h-4" />
        </Button>
        <Button variant="danger" onClick={leaveSession}>
          Leave
        </Button>
      </div>
    </div>
  </div>

  <div className="flex-1 flex">
    {/* Main Video Area */}
    <div className="flex-1 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4">
        <VideoGrid
          participants={participants}
          localStream={localStream}
          layout={videoLayout}
          onLayoutChange={setVideoLayout}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isMuted ? "danger" : "ghost"}
            onClick={toggleMute}
            className="w-12 h-12 rounded-full"
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </Button>

          <Button
            variant={isCameraOff ? "danger" : "ghost"}
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full"
          >
            {isCameraOff ? <VideoOffIcon /> : <VideoIcon />}
          </Button>

          <Button
            variant={isScreenSharing ? "primary" : "ghost"}
            onClick={toggleScreenShare}
            className="w-12 h-12 rounded-full"
          >
            <ScreenShareIcon />
          </Button>

          <Button
            variant={isHandRaised ? "warning" : "ghost"}
            onClick={toggleRaiseHand}
            className="w-12 h-12 rounded-full"
          >
            <HandRaiseIcon />
          </Button>

          <Button
            variant="ghost"
            onClick={openParticipants}
            className="w-12 h-12 rounded-full"
          >
            <UsersIcon />
            {participantCount}
          </Button>

          <Button
            variant="ghost"
            onClick={toggleChat}
            className="w-12 h-12 rounded-full relative"
          >
            <ChatIcon />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>

    {/* Sidebar */}
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 320 }}
          exit={{ width: 0 }}
          className="bg-white border-l border-gray-200 flex flex-col"
        >
          <TabsContainer value={sidebarTab} onValueChange={setSidebarTab}>
            <TabsList className="bg-gray-50">
              <TabsTrigger value="chat">
                Chat
                {unreadMessages > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="participants">
                Participants ({participantCount})
              </TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <ChatMessages
                messages={chatMessages}
                onSendMessage={sendChatMessage}
              />
            </TabsContent>

            <TabsContent
              value="participants"
              className="flex-1 overflow-y-auto"
            >
              <ParticipantsList
                participants={participants}
                currentUserId={user.id}
                isHost={session.hostId === user.id}
              />
            </TabsContent>

            <TabsContent value="qa" className="flex-1 flex flex-col">
              <QASection
                questions={qaQuestions}
                onAskQuestion={askQuestion}
                onAnswerQuestion={answerQuestion}
                canAnswer={session.hostId === user.id}
              />
            </TabsContent>
          </TabsContainer>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>
```

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints**

```css
/* Mobile First Approach */
.mobile {
  /* Default: 0-767px */
}
.tablet {
  @screen md: /* 768px-1023px */;
}
.desktop {
  @screen lg: /* 1024px+ */;
}
.desktop-xl {
  @screen xl: /* 1280px+ */;
}
```

### **Mobile Adaptations**

#### **Navigation**

- Header: Logo + Hamburger menu
- Sidebar: Full-screen overlay với backdrop
- Bottom tab bar cho main actions

#### **Course Cards**

- Single column layout
- Larger touch targets
- Swipe gestures cho carousel

#### **Video Player**

- Auto-rotate to landscape
- Picture-in-picture support
- Optimized controls for touch

#### **Quiz Interface**

- Single question per screen
- Large answer buttons
- Swipe navigation between questions

---

## 🔄 STATE MANAGEMENT

### **Context Providers** (`contexts/`)

#### **AuthContext**

```jsx
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (credentials) => {
    // Login logic
  };

  const logout = () => {
    // Logout logic
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

#### **CourseContext**

```jsx
const CourseContext = createContext();

export const useCourse = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
  const [currentCourse, setCurrentCourse] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const enrollInCourse = async (courseId) => {
    // Enrollment logic
  };

  const updateProgress = (lessonId, progress) => {
    // Progress update logic
  };

  return (
    <CourseContext.Provider
      value={{
        currentCourse,
        userProgress,
        enrolledCourses,
        enrollInCourse,
        updateProgress,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
```

---

## ⚡ REAL-TIME FEATURES

### **Socket.IO Integration** (`hooks/useSocket.js`)

```jsx
import { useEffect, useContext, createContext } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.VITE_SOCKET_URL, {
        auth: { token: user.token },
      });

      // Notification events
      newSocket.on("notification:new", (notification) => {
        // Handle new notification
      });

      // Progress events
      newSocket.on("progress:updated", (progress) => {
        // Handle progress update
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
```

### **Real-time Notifications**

```jsx
const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (socket) {
      socket.on("notification:new", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast
        toast.info(notification.title);
      });
    }
  }, [socket]);

  return { notifications, unreadCount };
};
```

---

## 🎨 UI/UX CONSIDERATIONS

### **Loading States**

- Skeleton screens cho course loading
- Progress spinners cho API calls
- Lazy loading cho images và videos

### **Error Handling**

- Error boundaries cho component crashes
- Retry mechanisms cho network failures
- User-friendly error messages

### **Performance Optimization**

- Code splitting by routes
- Image lazy loading và optimization
- Virtual scrolling cho large lists
- Memoization cho expensive calculations

### **Accessibility**

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus management
- ARIA labels và descriptions

---

## 📦 COMPONENT LIBRARY

### **Design Tokens**

```javascript
export const designTokens = {
  colors: {
    primary: "#4F46E5",
    secondary: "#059669",
    accent: "#F59E0B",
    error: "#DC2626",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
    "3xl": "64px",
  },

  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
  },
};
```

Đây là plan thiết kế giao diện chi tiết cho Student của MasterDev E-learning Platform. Plan này cung cấp đầy đủ thông tin để một lập trình viên middle level có thể implement được giao diện hoàn chỉnh và professional.
