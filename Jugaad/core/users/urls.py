from django.urls import path
from .views import (
    get_teachers,
    register_student,
    login_user,
    teacher_profile,
    create_teacher,
    teacher_login,
    get_students,
    student_profile,
    teacher_detail,
    student_detail,
    admin_login,
    get_departments
)

urlpatterns = [
    path('register/', register_student),
    path('login/', login_user),

    path('teacher/profile/', teacher_profile),
    path('teacher/register/', create_teacher),
    path('teacher/login/', teacher_login),

    path('teachers/', get_teachers),
    path('students/', get_students),
    path('teacher/<int:id>/', teacher_detail),
    path('student/<int:id>/', student_detail),
    path('student/profile/', student_profile),
    path('admin/login/',admin_login),
    path('departments/', get_departments),
]