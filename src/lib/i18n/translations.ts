export const translations = {
  en: {
    dashboard: { 
      title: 'Admin Dashboard',
      subtitle: 'Full platform overview and management.',
      breadcrumb: 'Admin Control Panel' 
    },
    table: { 
      name: 'NAME', 
      email: 'EMAIL', 
      role: 'ROLE', 
      joined: 'JOINED',
      recentSignups: 'Recent Signups', 
      viewAll: 'View all' 
    },
    usersTable: {
      searchPlaceholder: 'Search by name or email...',
      noUsers: 'No users found.',
      noMatch: 'No users match your filter.',
      user: 'User',
      email: 'Email',
      role: 'Role',
      joined: 'Joined',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      suspended: 'Suspended',
      suspend: 'Suspend',
      reinstate: 'Reinstate',
      all: 'All',
      pageTitle: 'Users',
      pageSubtitle: 'Manage platform accounts and permissions.',
      addUser: 'Add User',
      addNewUser: 'Add New User',
      fullName: 'Full Name',
      password: 'Password',
      minChars: 'Min. 6 characters',
      createUser: 'Create User',
      userCreated: 'User created successfully.',
      createFailed: 'Failed to create user.',
      userDeleted: 'User deleted.',
      deleteUser: 'Delete User?',
      changeRole: 'Change Role?',
      updateStatus: 'Update User Status?',
      confirmDelete: 'This will permanently delete the user and all their data. This cannot be undone.',
      confirmSuspendText: 'This will suspend the user\'s account.',
      confirmReinstateText: 'This will reinstate the user\'s account.',
      delete: 'Delete',
      confirmAction: 'Confirm Action',
      confirmSuspend: 'Suspend this user? They will be unable to log in.',
      confirmRoleChange: 'Change this user\'s role to "{role}"?',
      cancel: 'Cancel',
      confirm: 'Confirm',
      roleUpdated: 'Role updated.',
      userSuspended: 'Account suspended.',
      updateFailed: 'Failed to update user.',
      actionFailed: 'Action failed.',
      previous: 'Previous',
      next: 'Next',
      page: 'Page'
    },
    analytics: {
      newUsersTitle: 'New Users (Last 30 Days)',
      topCoursesTitle: 'Top 5 Courses by Enrollment',
      recentTransactionsTitle: 'Recent Transactions',
      student: 'Student',
      course: 'Course',
      amount: 'Amount',
      date: 'Date',
      noTransactions: 'No transactions yet.',
      enrollments: 'Enrollments',
      users: 'Users'
    },
    health: { 
      title: 'Platform Health', 
      database: 'Database',
      auth: 'Auth', 
      storage: 'Storage', 
      ok: 'OK' 
    },
    actions: { 
      title: 'QUICK ACTIONS', 
      manageUsers: 'Manage Users',
      moderateCourses: 'Moderate Courses' 
    },
    stats: { 
      totalUsers: 'Total Users', 
      totalTeachers: 'Total Teachers',
      totalStudents: 'Total Students', 
      totalRevenue: 'Total Revenue' 
    },
    roles: { 
      student: 'Student', 
      teacher: 'Teacher', 
      admin: 'Admin' 
    },
    nav: { 
      dashboard: 'Dashboard', 
      users: 'Users', 
      courses: 'Courses',
      analytics: 'Analytics', 
      settings: 'Settings', 
      signOut: 'Sign Out',
      assignments: 'Assignments',
      grades: 'Grades',
      createCourse: 'Create Course',
      portal: {
        admin: 'Admin Portal',
        student: 'Student Portal',
        teacher: 'Teacher Portal'
      },
      welcome: 'Welcome back,'
    },
    chat: {
      title: 'Maqam Assistant',
      placeholder: 'Ask Maqam Assistant...',
      clearHistory: 'Clear History',
      close: 'Close',
      greeting: 'Welcome to Academy of the Maqam. I am your musical assistant "Maqam Assistant". How can I help you today?',
      error: 'Error connecting to the tutor. Please try again.'
    },
    invite: {
      inviteStudent: 'Invite Student',
      inviteUser: 'Invite by Email',
      emailLabel: 'Email Address',
      courseLabel: 'Enroll in Course (optional)',
      noCourse: '— No course enrollment —',
      sendBtn: 'Send Invitation',
      success: 'Invitation sent! The student will receive an email to set up their account.',
      failed: 'Failed to send invitation.',
      sending: 'Sending...',
      modalTitle: 'Invite a Student',
    },
    status: { platformOnline: 'Platform Online' },
    toggle: { ar: 'AR', en: 'EN' }
  },
  ar: {
    dashboard: { 
      title: 'لوحة تحكم المشرف',
      subtitle: 'نظرة شاملة على المنصة وإدارتها.',
      breadcrumb: 'بوابة المشرف' 
    },
    table: { 
      name: 'الاسم', 
      email: 'البريد الإلكتروني', 
      role: 'الدور',
      joined: 'تاريخ الانضمام', 
      recentSignups: 'آخر التسجيلات', 
      viewAll: 'عرض الكل' 
    },
    usersTable: {
      searchPlaceholder: 'البحث بالاسم أو البريد...',
      noUsers: 'لا يوجد مستخدمون.',
      noMatch: 'لا يوجد مستخدمون يطابقون الفلتر.',
      user: 'المستخدم',
      email: 'البريد',
      role: 'الدور',
      joined: 'انضم في',
      status: 'الحالة',
      actions: 'إجراءات',
      active: 'نشط',
      suspended: 'موقوف',
      suspend: 'إيقاف',
      reinstate: 'إعادة التفعيل',
      all: 'الكل',
      pageTitle: 'المستخدمون',
      pageSubtitle: 'إدارة حسابات المنصة والصلاحيات.',
      addUser: 'إضافة مستخدم',
      addNewUser: 'إضافة مستخدم جديد',
      fullName: 'الاسم الكامل',
      password: 'كلمة المرور',
      minChars: '6 أحرف على الأقل',
      createUser: 'إنشاء المستخدم',
      userCreated: 'تم إنشاء المستخدم بنجاح.',
      createFailed: 'فشل إنشاء المستخدم.',
      userDeleted: 'تم حذف المستخدم.',
      deleteUser: 'حذف المستخدم؟',
      changeRole: 'تغيير الدور؟',
      updateStatus: 'تحديث حالة المستخدم؟',
      confirmDelete: 'سيتم حذف المستخدم وجميع بياناته نهائياً. لا يمكن التراجع عن هذا.',
      confirmSuspendText: 'سيتم تعليق حساب المستخدم.',
      confirmReinstateText: 'سيتم إعادة تفعيل حساب المستخدم.',
      delete: 'حذف',
      confirmAction: 'تأكيد الإجراء',
      confirmSuspend: 'إيقاف هذا المستخدم؟ لن يتمكن من تسجيل الدخول.',
      confirmRoleChange: 'تغيير دور هذا المستخدم إلى "{role}"؟',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      roleUpdated: 'تم تحديث الدور.',
      userSuspended: 'تم إيقاف الحساب.',
      updateFailed: 'فشل تحديث المستخدم.',
      actionFailed: 'فشل تنفيذ الإجراء.',
      previous: 'السابق',
      next: 'التالي',
      page: 'صفحة'
    },
    analytics: {
      newUsersTitle: 'المستخدمون الجدد (آخر 30 يوماً)',
      topCoursesTitle: 'أفضل 5 دورات من حيث التسجيل',
      recentTransactionsTitle: 'آخر العمليات',
      student: 'الطالب',
      course: 'الدورة',
      amount: 'المبلغ',
      date: 'التاريخ',
      noTransactions: 'لا يوجد عمليات حتى الآن.',
      enrollments: 'التسجيلات',
      users: 'المستخدمين'
    },
    health: { 
      title: 'حالة المنصة', 
      database: 'قاعدة البيانات',
      auth: 'المصادقة', 
      storage: 'التخزين', 
      ok: 'متاح' 
    },
    actions: { 
      title: 'إجراءات سريعة', 
      manageUsers: 'إدارة المستخدمين',
      moderateCourses: 'إدارة الدورات' 
    },
    stats: { 
      totalUsers: 'إجمالي المستخدمين', 
      totalTeachers: 'إجمالي المعلمين',
      totalStudents: 'إجمالي الطلاب', 
      totalRevenue: 'إجمالي الإيرادات' 
    },
    roles: { 
      student: 'طالب', 
      teacher: 'معلم', 
      admin: 'مدير' 
    },
    nav: { 
      dashboard: 'لوحة التحكم', 
      users: 'المستخدمون', 
      courses: 'الدورات',
      analytics: 'التحليلات', 
      settings: 'الإعدادات', 
      signOut: 'تسجيل الخروج',
      assignments: 'الواجبات',
      grades: 'الدرجات',
      createCourse: 'إنشاء دورة',
      portal: {
        admin: 'بوابة المشرف',
        student: 'بوابة الطالب',
        teacher: 'بوابة المعلم'
      },
      welcome: 'مرحباً بعودتك،'
    },
    chat: {
      title: 'مساعد المقام',
      placeholder: 'اسأل مساعد المقام...',
      clearHistory: 'مسح السجل',
      close: 'إغلاق',
      greeting: 'أهلاً بك في أكاديمية المقام. أنا مساعدك الموسيقي "مساعد المقام". كيف يمكنني مساعدتك اليوم؟',
      error: 'حدث خطأ في الاتصال بالمعلم. يرجى المحاولة مرة أخرى.'
    },
    invite: {
      inviteStudent: 'دعوة طالب',
      inviteUser: 'دعوة بالبريد الإلكتروني',
      emailLabel: 'البريد الإلكتروني',
      courseLabel: 'التسجيل في دورة (اختياري)',
      noCourse: '— بدون تسجيل في دورة —',
      sendBtn: 'إرسال الدعوة',
      success: 'تم إرسال الدعوة! سيتلقى الطالب بريداً إلكترونياً لإعداد حسابه.',
      failed: 'فشل إرسال الدعوة.',
      sending: 'جاري الإرسال...',
      modalTitle: 'دعوة طالب',
    },
    status: { platformOnline: 'المنصة متاحة' },
    toggle: { ar: 'AR', en: 'EN' }
  }
};
export type Lang = 'en' | 'ar';
export type Translations = typeof translations.en;
