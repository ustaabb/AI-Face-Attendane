from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from attendance.models import Attendance, AttendanceSession
from users.models import Student


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def qr_attendance(request):

    roll = request.data.get("roll")

    session = AttendanceSession.objects.filter(is_active=True).first()

    if not session:
        return Response({"error": "No active session"}, status=400)

    # 🔴 TIME CHECK
    now = timezone.now()
    if now < session.start_time or now > session.end_time:
        return Response({"error": "Session expired"}, status=403)

    if not session.allow_qr:
        return Response({"error": "QR disabled"}, status=403)

    try:
        student = Student.objects.get(university_roll_no=roll)

        if Attendance.objects.filter(student=student, session=session).exists():
            return Response({"message": "Already marked"})

        Attendance.objects.create(
            student=student,
            session=session,
            method="qr"
        )

        return Response({"status": "success"})

    except Student.DoesNotExist:
        return Response({"error": "Invalid QR"}, status=400)