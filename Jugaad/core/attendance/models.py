from django.db import models
from django.utils import timezone
from users.models import Student, Teacher


# 🔥 SESSION (Teacher controls attendance)
class AttendanceSession(models.Model):
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="sessions"
    )

    # ✅ CLASS TARGETING
    department = models.CharField(max_length=100)
    class_name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    semester = models.CharField(max_length=20)  # ✅ NEW FIELD

    session_type = models.CharField(
    max_length=10,
    choices=[('face', 'Face'), ('qr', 'QR')],
    default='face'
    )

    # ✅ TIME HANDLING
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)

    # ✅ MODE CONTROL
    qr_code = models.ImageField(upload_to="qr/", null=True, blank=True)
    qr_used_students = models.JSONField(default=list)
    allow_face = models.BooleanField(default=True)

    # ✅ SESSION STATE
    is_active = models.BooleanField(default=True)
    manual_stop = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    # 🔥 CHECK IF SESSION IS STILL ACTIVE
    def is_session_active(self):
        if not self.is_active:
            return False

        if self.end_time and timezone.now() > self.end_time:
            return False

        return True

    # 🔥 STOP SESSION
    def stop_session(self):
        self.is_active = False
        self.manual_stop = True
        self.end_time = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.teacher.user.username} - {self.department} - {self.class_name} - {self.subject}"


# 🔥 STUDENT ATTENDANCE
class Attendance(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name="session_attendance"
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    METHOD_CHOICES = (
        ('face', 'Face'),
        ('qr', 'QR'),
    )

    method = models.CharField(
        max_length=10,
        choices=METHOD_CHOICES,
        default='face'
    )

    # 🔥 STATUS FIELD
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='Present'
    )

    # 🔥 FACE DISTANCE (for AI debugging)
    face_distance = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'session')  # 🚨 prevent duplicate
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student.user.username} - {self.session.subject} - {self.status}"


# 🔥 HELPER FUNCTION (ATTENDANCE PERCENTAGE)
def get_student_percentage(student, subject=None):
    """
    Calculate attendance percentage
    """
    records = Attendance.objects.filter(student=student)

    if subject:
        records = records.filter(session__subject=subject)

    total = records.count()
    present = records.filter(status='Present').count()

    if total == 0:
        return 0

    return round((present / total) * 100, 2)