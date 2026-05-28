from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
import qrcode
import os
import numpy as np

from .models import AttendanceSession, Attendance
from users.models import Teacher, Student

from django.db.models import Count

# 🔴 STUDENT DASHBOARD
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    records = Attendance.objects.filter(student=student)

    total_attendance = records.count()

    subject_data = records.values('session__subject').annotate(
        attended=Count('id')
    )

    return Response({
        "total_attendance": total_attendance,
        "subject_data": list(subject_data)
    })


# 🔴 TEACHER DASHBOARD
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard(request):

    if request.user.role != 'teacher':
        return Response({"error": "Only teachers allowed"}, status=403)

    try:
        teacher = Teacher.objects.get(user=request.user)
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=404)

    sessions = AttendanceSession.objects.filter(teacher=teacher)

    data = []

    for session in sessions:

        total_students = Student.objects.filter(
            department=session.department,
            class_name=session.class_name
        ).count()

        attended = Attendance.objects.filter(session=session).count()

        percentage = (attended / total_students * 100) if total_students > 0 else 0

        data.append({
            "session_id": session.id,
            "subject": session.subject,
            "department": session.department,
            "class_name": session.class_name,
            "attendance_count": attended,
            "percentage": round(percentage, 2),
            "is_active": session.is_active
        })

    return Response(data)


# 🔴 STUDENT PERCENTAGE
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_percentage(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    # ✅ TOTAL SESSIONS (FIXED)
    total_sessions = AttendanceSession.objects.filter(
        department=student.department,
        class_name=student.class_name,
        semester=student.semester   # 🔥 IMPORTANT FIX
    ).count()

    # ✅ PRESENT COUNT
    attended_sessions = Attendance.objects.filter(student=student).count()

    percentage = 0
    if total_sessions > 0:
        percentage = round((attended_sessions / total_sessions) * 100, 2)

    return Response({
        "total_sessions": total_sessions,
        "attended": attended_sessions,
        "percentage": percentage
    })

# 🔴 CREATE SESSION
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):

    if request.user.role != 'teacher':
        return Response({"error": "Only teachers allowed"}, status=403)

    try:
        teacher = Teacher.objects.get(user=request.user)
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher profile not found"}, status=404)

    subject = request.data.get("subject")
    department = request.data.get("department")
    class_name = request.data.get("class_name")
    semester = request.data.get("semester")
    session_type = request.data.get("type", "face")

    if not subject or not department or not class_name:
        return Response({"error": "All fields required"}, status=400)

    existing = AttendanceSession.objects.filter(
    teacher=teacher,
    department=department,
    class_name=class_name,
    semester=semester,
    is_active=True
    ).first()

    if existing:
        return Response({
            "error": f"A {existing.session_type.upper()} session is already active for this class. Stop it first."
        }, status=400)

    session = AttendanceSession.objects.create(
        teacher=teacher,
        subject=subject,
        department=department,
        class_name=class_name,
        semester=semester,
        session_type=session_type
    )

    # 🔥 QR CODE
    qr_data = f"session:{session.id}"
    img = qrcode.make(qr_data)

    os.makedirs("media/qr", exist_ok=True)

    file_path = f"media/qr/session_{session.id}.png"
    img.save(file_path)

    session.qr_code = f"qr/session_{session.id}.png"
    session.save()

    return Response({
        "message": "Session started",
        "session_id": session.id
    })


# 🔴 STOP SESSION
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_session(request):

    session_id = request.data.get("session_id")

    try:
        session = AttendanceSession.objects.get(id=session_id)

        if session.teacher.user != request.user:
            return Response({"error": "Not your session"}, status=403)

        session.stop_session()

        return Response({"message": "Session stopped"})

    except AttendanceSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)


# 🔴 GET SESSIONS (STUDENT REAL-TIME)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    sessions = AttendanceSession.objects.filter(
    department=student.department,
    class_name=student.class_name,
    semester=student.semester,   # ✅ FIXED SEMESTER FILTER
    is_active=True
    )

    data = []

    for s in sessions:
        data.append({
            "id": s.id,
            "subject": s.subject,
            "teacher_name": s.teacher.user.username,
            "is_active": s.is_active,
            "session_type": s.session_type
        })

    return Response(data)


# 🔴 MARK ATTENDANCE (🔥 AI FACE MATCHING)
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    session_id = request.data.get("session_id")

    if not session_id:
        return Response({"error": "Session ID required"}, status=400)

    try:
        student = Student.objects.get(user=request.user)
        session = AttendanceSession.objects.get(id=session_id)
    except:
        return Response({"error": "Invalid session"}, status=400)

    if session.session_type != "face":
        return Response({"error": "Not a face session"}, status=400)

    if not session.is_session_active():
        return Response({"error": "Session expired"}, status=400)

    if Attendance.objects.filter(student=student, session=session).exists():
        return Response({"error": "Already marked"}, status=400)

    Attendance.objects.create(
        student=student,
        session=session,
        method="face"
    )

    return Response({"message": "Face Attendance Marked ✅"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_qr_attendance(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    session_id = request.data.get("session_id")
    qr_data = request.data.get("qr_data")

    if not session_id or not qr_data:
        return Response({"error": "Missing data"}, status=400)

    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=400)

    try:
        session = AttendanceSession.objects.get(id=session_id)
    except AttendanceSession.DoesNotExist:
        return Response({"error": "Invalid session"}, status=400)

    # 🔥 CHECK SESSION TYPE
    if session.session_type != "qr":
        return Response({"error": "Not a QR session"}, status=400)

    # 🔥 CHECK ACTIVE
    if not session.is_session_active():
        return Response({"error": "Session expired"}, status=400)

    # 🔥 PREVENT DUPLICATE
    if Attendance.objects.filter(student=student, session=session).exists():
        return Response({"error": "Already marked"}, status=400)

    # 🔥 PREVENT QR REUSE
    if student.id in session.qr_used_students:
        return Response({"error": "QR already used"}, status=400)

    # 🔥 VALIDATE QR (UPDATED)
    valid_qr_1 = f"session_{session.id}"
    valid_qr_2 = f"http://localhost:3000/mark-attendance/{session.id}"

    print("QR DATA RECEIVED:", qr_data)  # 🔥 DEBUG

    if qr_data not in [valid_qr_1, valid_qr_2]:
        return Response({"error": "Invalid QR"}, status=400)

    # 🔥 MARK ATTENDANCE
    Attendance.objects.create(
        student=student,
        session=session,
        method="qr"
    )

    # 🔥 SAVE USAGE
    session.qr_used_students.append(student.id)
    session.save()

    return Response({"message": "QR Attendance Marked ✅"})
    
@api_view(['GET'])
def admin_attendance_view(request):

    department = request.GET.get('department')
    semester = request.GET.get('semester') 

    students = Student.objects.all()

    if department:
        students = students.filter(department=department)

    if semester:
        students = students.filter(semester=int(semester))

    students = students.select_related('user')

    data = []

    for s in students:

        # 🔥 TOTAL SESSIONS (IMPORTANT FIX)
        total_sessions = AttendanceSession.objects.filter(
            department=s.department,
            class_name=s.class_name,
            semester=s.semester
        ).count()

        # 🔥 PRESENT COUNT
        present_count = Attendance.objects.filter(student=s).count()

        percentage = 0
        if total_sessions > 0:
            percentage = round((present_count / total_sessions) * 100, 2)

        data.append({
            "name": s.user.name if s.user else "N/A",
            "email": s.user.username if s.user else "N/A",  # ✅ FIXED
            "roll_number": s.university_roll_no,
            "department": s.department,
            "semester": s.semester,
            "percentage": percentage
        })

    return Response(data)

# 🔥 GET STUDENTS BASED ON CLASS + DEPARTMENT
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_students(request):

    if request.user.role != 'teacher':
        return Response({"error": "Only teachers allowed"}, status=403)

    department = request.data.get("department")
    class_name = request.data.get("class_name")

    if not department or not class_name:
        return Response({"error": "Department and class required"}, status=400)

    students = Student.objects.filter(
        department=department,
        class_name=class_name
    ).select_related("user")

    data = []

    for s in students:
        data.append({
            "id": s.id,
            "name": s.user.name,
            "roll": s.university_roll_no,
            "email": s.user.username,          # ✅ ADD
            "department": s.department,     # ✅ ADD
            "class_name": s.class_name,     # ✅ ADD
            "semester": s.semester          # ✅ ADD
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_attendance_summary(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    student = Student.objects.get(user=request.user)

    data = []

    from django.db.models import Count

    unique_pairs = (
        AttendanceSession.objects
        .filter(
            department=student.department,
            class_name=student.class_name,
            semester=student.semester   # ✅ FIXED SEMESTER FILTER
        )
        .values('teacher', 'subject')
        .annotate(total_sessions=Count('id'))
    )

    for item in unique_pairs:
        teacher_id = item['teacher']
        subject = item['subject']
        total_sessions = item['total_sessions']

        present_count = Attendance.objects.filter(
            student=student,
            session__teacher_id=teacher_id,
            session__subject=subject
        ).distinct().count()

        absent_count = total_sessions - present_count

        percentage = 0
        if total_sessions > 0:
            percentage = (present_count / total_sessions) * 100

        teacher = Teacher.objects.get(id=teacher_id)

        data.append({
            "teacher": teacher.user.name,
            "subject": subject,
            "total_lectures": f"{present_count}/{total_sessions}",
            "present": present_count,
            "absent": absent_count,
            "percentage": round(percentage, 2)
        })

    return Response(data)

import cv2
import numpy as np
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_upload(request):

    if request.user.role != 'student':
        return Response({"error": "Only students allowed"}, status=403)

    image = request.FILES.get("image")
    session_id = request.data.get("session_id")

    print("Received session_id:", session_id)

    if not image:
        return Response({"error": "No image uploaded"}, status=400)

    try:
        student = Student.objects.get(user=request.user)
        session = AttendanceSession.objects.get(id=session_id)
    except:
        return Response({"error": "Invalid session"}, status=400)

    # 🔥 READ IMAGE
    file_bytes = np.frombuffer(image.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    # 🔥 QR DETECTION
    detector = cv2.QRCodeDetector()
    qr_data, bbox, _ = detector.detectAndDecode(img)

    print("QR DATA RECEIVED:", qr_data)  # 🔥 DEBUG

    if not qr_data:
        return Response({"error": "No QR found"}, status=400)

    # 🔥 FIXED VALIDATION
    valid_qr_1 = f"session_{session.id}"
    valid_qr_2 = f"session:{session.id}"   # 🔥 ADD THIS
    valid_qr_3 = f"http://localhost:3000/mark-qr/{session.id}"
    valid_qr_4 = f"http://localhost:3000/mark-attendance/{session.id}"

    if qr_data not in [valid_qr_1, valid_qr_2, valid_qr_3, valid_qr_4]:
        return Response({"error": "Invalid QR"}, status=400)

    # 🔥 PREVENT DUPLICATE
    if Attendance.objects.filter(student=student, session=session).exists():
        return Response({"error": "Already marked"})

    # 🔥 MARK ATTENDANCE
    Attendance.objects.create(
        student=student,
        session=session,
        method="qr"
    )

    return Response({"message": "QR Attendance Marked via Upload ✅"})

@api_view(['GET'])
def student_subject_report(request):

    department = request.GET.get('department')
    semester = request.GET.get('semester')

    if semester:
        try:
            semester = int(semester)
        except ValueError:
            return Response({"error": "Invalid semester"}, status=400)
    class_name_1exact = request.GET.get('class_name_exact')

    students = Student.objects.all()

    if department:
        students = students.filter(department=department)

    if semester:
        students = students.filter(semester=semester)

    data = []

    for s in students:

        # 🔥 GET SUBJECT-WISE TOTAL LECTURES
        subjects = (
            AttendanceSession.objects
            .filter(
                department=department if department else s.department,
                semester=semester if semester else s.semester,
                class_name=class_name_1exact if class_name_1exact else s.class_name
            )
            .values('subject')
            .annotate(total=Count('id'))
        )

        subject_list = []

        for sub in subjects:
            subject_name = sub['subject']
            total_lectures = sub['total']

            attended = Attendance.objects.filter(
                student=s,
                session__subject=subject_name
            ).count()

            subject_list.append({
                "subject": subject_name,
                "attended": attended,
                "total": total_lectures
            })

        data.append({
            "id": s.id,
            "name": s.user.name,
            "roll": s.university_roll_no,
            "subjects": subject_list
        })

    return Response(data)

@api_view(['POST'])
def update_subject_attendance(request):

    student_id = request.data.get('student_id')
    subject = request.data.get('subject')
    new_attended = int(request.data.get('attended'))

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    # 🔥 GET ALL SESSIONS FOR THIS SUBJECT
    sessions = AttendanceSession.objects.filter(
        subject=subject,
        department=student.department,
        class_name=student.class_name,
        semester=student.semester
    )

    # 🔥 CURRENT ATTENDANCE
    current_records = Attendance.objects.filter(
        student=student,
        session__in=sessions
    )

    current_attended = current_records.count()

    # 🔥 CALCULATE DIFFERENCE
    diff = new_attended - current_attended

    # ✅ ADD ATTENDANCE
    if diff > 0:
        # sessions not already attended
        remaining_sessions = sessions.exclude(
            id__in=current_records.values_list("session_id", flat=True)
        )[:diff]

        for session in remaining_sessions:
            Attendance.objects.create(
                student=student,
                session=session,
                method="manual"
            )

    # ✅ REMOVE ATTENDANCE
    elif diff < 0:
        to_remove = current_records[:abs(diff)]
        for record in to_remove:
            record.delete()

    return Response({
        "message": "Attendance Updated ✅",
        "previous": current_attended,
        "new": new_attended
    })