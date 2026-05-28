from django.urls import path
from .views import (
    admin_attendance_view,
    create_session,
    student_dashboard,
    teacher_dashboard,
    student_percentage,
    stop_session,
    get_sessions,       # ✅ NEW
    mark_attendance,    # ✅ NEW
    get_students,
    student_attendance_summary,
    mark_qr_attendance,
    scan_upload, 
    student_subject_report,
    update_subject_attendance       # ✅ NEW
)

urlpatterns = [
    # 🔥 SESSION CONTROL
    path('create-session/', create_session),
    path('stop-session/', stop_session),
    path('get-students/', get_students),

    # 🔥 DASHBOARDS
    path('student-dashboard/', student_dashboard),
    path('teacher-dashboard/', teacher_dashboard),
    path('student-percentage/', student_percentage),

    # 🔥 CORE REAL-TIME APIs (MOST IMPORTANT)
    path('get-sessions/', get_sessions),
    path('mark-attendance/', mark_attendance),
    path('mark-qr-attendance/', mark_qr_attendance),
    path('admin-view/', admin_attendance_view),
    path('scan-upload/', scan_upload),
    path('student-summary/', student_attendance_summary),   
    path('student-subject-report/', student_subject_report),
    path('update-subject-attendance/', update_subject_attendance),

]