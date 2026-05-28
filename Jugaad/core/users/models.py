from django.db import models
from django.contrib.auth.models import AbstractUser


# 🔥 Custom User (Admin / Teacher / Student)
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    name = models.CharField(max_length=100, blank=True, null=True)

    # 🔥 IMPORTANT → PREVENT DUPLICATE EMAILS
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


# 🔴 STUDENT MODEL
class Student(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    father_name = models.CharField(max_length=100)

    # ✅ UNIQUE ROLL NUMBER
    university_roll_no = models.CharField(max_length=20, unique=True)

    dob = models.DateField(null=True, blank=True)
    semester = models.IntegerField()

    # ✅ FLEXIBLE (NO HARDCODED CHOICES)
    class_name = models.CharField(max_length=50)
    department = models.CharField(max_length=100)

    photo = models.ImageField(upload_to="students/", null=True, blank=True)

    # 🔥 AI FACE ENCODING
    face_encoding = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.name or self.user.username} - {self.university_roll_no}"


# 🔴 TEACHER MODEL
class Teacher(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="teacher_profile"
    )

    # ✅ FLEXIBLE FIELDS
    department = models.CharField(max_length=100)
    semester = models.IntegerField()

    class_name = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    # 🔥 NEW FIELD (VERY IMPORTANT)
    subject = models.CharField(max_length=100)

    qualifications = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"{self.user.name or self.user.username} - {self.subject}"

