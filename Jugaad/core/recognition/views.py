from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from deepface import DeepFace
import numpy as np
import json
import os

from users.models import Student
from attendance.models import Attendance, AttendanceSession


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def face_attendance(request):
    print("FILES:", request.FILES)
    print("DATA:", request.data)

    import numpy as np
    import os

    photos = request.FILES.getlist("images")

    if not photos:
        return Response({"error": "No images received"}, status=400)

    session_id = request.data.get("session_id")

    if not session_id:
        return Response({"error": "Session ID required"}, status=400)

    try:
        session = AttendanceSession.objects.get(id=session_id)
    except AttendanceSession.DoesNotExist:
        return Response({"error": "Invalid session"}, status=404)

    now = timezone.now()

    if now < session.start_time:
        return Response({"error": "Session not started yet"}, status=403)

    if session.end_time and now > session.end_time:
        return Response({"error": "Session expired"}, status=403)

    if session.session_type != "face":
        return Response({"error": "Face attendance not allowed"}, status=403)

    if len(photos) < 4:
        return Response({
            "error": "Capture at least 4 live frames ❌"
        }, status=400)

    os.makedirs("media/temp", exist_ok=True)

    embeddings = []
    temp_files = []

    # 🔥 PROCESS FRAMES
    for i, photo in enumerate(photos):

        path = f"media/temp/scan_{i}.jpg"
        temp_files.append(path)

        with open(path, "wb") as f:
            for chunk in photo.chunks():
                f.write(chunk)

        try:
            result = DeepFace.represent(
                img_path=path,
                model_name="Facenet",
                enforce_detection=True
            )

            if result and len(result) > 0:
                embeddings.append(result[0]["embedding"])

        except:
            continue

    # 🔥 CLEAN FILES
    for file in temp_files:
        if os.path.exists(file):
            os.remove(file)

    if len(embeddings) == 0:
        return Response({"error": "No valid face embeddings"}, status=422)

    # 🔴 FACE DETECTION CHECK
    if len(embeddings) < max(2, len(photos) // 2):
        return Response({
            "error": "Face not detected clearly ❌"
        }, status=422)
    # ✅ CONVERT TO NUMPY ARRAY (CRITICAL FIX)
    embeddings = np.array(embeddings, dtype=np.float32)

    # =========================
    # 🔥 🔥 ULTIMATE LIVENESS 🔥 🔥
    # =========================

    # 1️⃣ VARIATION CHECK (anti-photo)
    variation = np.mean(np.std(embeddings, axis=0))
    if variation < 0.005:
        return Response({
            "error": "Static or fake face detected ❌"
        }, status=422)

    # 2️⃣ HEAD MOVEMENT CHECK
    movement = np.linalg.norm(embeddings[0] - embeddings[-1])
    if movement < 0.04:
        return Response({
            "error": "Move your face (left/right/up) ❌"
        }, status=422)

    # 3️⃣ FRAME UNIQUENESS CHECK
    similarities = []
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            sim = np.dot(embeddings[i], embeddings[j]) / (
                np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])
            )
            similarities.append(sim)

    if np.mean(similarities) > 0.990:
        return Response({
            "error": "Duplicate or replayed frames detected ❌"
        }, status=422)

    # 4️⃣ CONSISTENCY CHECK
    center = np.mean(embeddings, axis=0)
    distances = [np.linalg.norm(e - center) for e in embeddings]

    if np.max(distances) > 2.5:
        return Response({
            "error": "Unstable face capture ❌"
        }, status=422)

    # 5️⃣ MOTION FLOW CHECK
    diffs = []
    for i in range(len(embeddings) - 1):
        diffs.append(np.linalg.norm(embeddings[i] - embeddings[i+1]))

    if np.mean(diffs) < 0.05:
        return Response({
            "error": "No natural movement detected ❌"
        }, status=422)

    # =========================
    # 🔥 FACE MATCHING
    # =========================

    scan_vec = np.mean(embeddings, axis=0)
    scan_vec = scan_vec / (np.linalg.norm(scan_vec) + 1e-8)

    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    if student.department != session.department:
        return Response({
            "error": "You are not part of this department ❌"
        }, status=403)

    stored = np.array(student.face_encoding, dtype=np.float32)
    stored = stored / (np.linalg.norm(stored) + 1e-8)

    similarity = np.dot(scan_vec, stored)

    # 🔥 FINAL MATCH THRESHOLD
    if similarity < 0.68:
        return Response({
            "error": "Face not matched ❌",
            "similarity": float(similarity)
        }, status=403)

    # 🔥 DUPLICATE CHECK
    if Attendance.objects.filter(student=student, session=session).exists():
        return Response({"message": "Already marked"})

    # 🔥 MARK ATTENDANCE
    Attendance.objects.create(
        student=student,
        session=session,
        method="face"
    )

    return Response({
        "status": "success",
        "student": student.user.username,
        "similarity": float(similarity)
    })
