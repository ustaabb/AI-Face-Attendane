from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, Student, Teacher
from deepface import DeepFace
import numpy as np
import os
from django.views.decorators.csrf import csrf_exempt

# 🔴 REGISTER STUDENT
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request):

    import numpy as np
    import os

    try:
        email = request.data.get("email")
        password = request.data.get("password")
        name = request.data.get("name")

        dob = request.data.get("dob")
        father_name = request.data.get("father_name")
        class_name = request.data.get("class_name")
        roll = request.data.get("university_roll_no")
        department = request.data.get("department")
        semester = request.data.get("semester")

        photos = request.FILES.getlist("images")

        # 🔥 BASIC VALIDATION
        if not email or not password or not roll or not name:
            return Response({"error": "Missing required fields"}, status=400)

        if CustomUser.objects.filter(username=email).exists():
            return Response({"error": "Email already exists"}, status=409)

        if len(photos) < 4:
            return Response({
                "error": "Capture at least 4 live face frames ❌"
            }, status=400)

        os.makedirs("media/temp", exist_ok=True)

        embeddings = []
        temp_files = []

        # 🔥 PROCESS IMAGES (STRICT FACE DETECTION)
        for i, photo in enumerate(photos):
            path = f"media/temp/frame_{i}.jpg"
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

        # 🔥 CLEAN TEMP FILES
        for file in temp_files:
            if os.path.exists(file):
                os.remove(file)

        # 🔴 FACE DETECTION CHECK
        if len(embeddings) < 4:
            return Response({
                "error": "Face not detected clearly in all frames ❌"
            }, status=422)

        embeddings = np.array(embeddings)

        # =========================
        # 🔥 🔥 ULTIMATE LIVENESS 🔥 🔥
        # =========================

        # 1️⃣ VARIATION CHECK (anti-static/photo)
        variation = np.mean(np.std(embeddings, axis=0))
        if variation < 0.015:
            return Response({
                "error": "Static or fake face detected ❌"
            }, status=422)

        # 2️⃣ HEAD MOVEMENT CHECK (first vs last)
        movement = np.linalg.norm(embeddings[0] - embeddings[-1])
        if movement < 0.15:
            return Response({
                "error": "Move your face (left/right/up) during capture ❌"
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

        # 4️⃣ CONSISTENCY CHECK (remove noisy captures)
        center = np.mean(embeddings, axis=0)
        distances = [np.linalg.norm(e - center) for e in embeddings]

        if np.max(distances) > 4:
            return Response({
                "error": "Inconsistent face capture. Keep face steady ❌"
            }, status=422)

        # 5️⃣ DIRECTIONAL CHANGE CHECK (multi-angle validation)
        diffs = []
        for i in range(len(embeddings) - 1):
            diffs.append(np.linalg.norm(embeddings[i] - embeddings[i+1]))

        if np.mean(diffs) < 0.05:
            return Response({
                "error": "Not enough face movement detected ❌"
            }, status=422)

        # =========================
        # 🔥 FINAL EMBEDDING
        # =========================

        avg_embedding = np.mean(embeddings, axis=0)
        avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)

        # 🔥 CREATE USER
        user = CustomUser.objects.create_user(
            username=email,
            password=password,
            role="student",
            name=name
        )

        # 🔥 CREATE STUDENT
        Student.objects.create(
            user=user,
            father_name=father_name,
            university_roll_no=roll,
            dob=dob if dob else None,
            class_name=class_name,
            department=department,
            semester=semester,
            face_encoding=avg_embedding.tolist()
        )

        return Response({
            "status": "success",
            "message": "Registration successful"
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# 🔴 LOGIN
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):

    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)

    user = authenticate(username=email, password=password)

    if user:
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,
            "name": user.name
        })

    return Response({"error": "Invalid credentials"}, status=401)


# 🔴 TEACHER LOGIN
@api_view(['POST'])
@permission_classes([AllowAny])
def teacher_login(request):

    email = request.data.get("email")
    password = request.data.get("password")

    user = authenticate(username=email, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    if user.role != "teacher":
        return Response({"error": "Not a teacher"}, status=403)

    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "role": user.role,
        "name": user.name
    })


# 🔴 CREATE TEACHER
@api_view(['POST'])
@permission_classes([AllowAny])
def create_teacher(request):

    try:
        name = request.data.get("name")
        email = request.data.get("email")
        department = request.data.get("department")
        class_name = request.data.get("class_name")
        subject = request.data.get("subject")
        qualifications = request.data.get("qualifications")
        semester = request.data.get("semester")

        if not name or not email:
            return Response({"error": "Name and Email required"}, status=400)

        if CustomUser.objects.filter(username=email).exists():
            return Response({"error": "Teacher already exists"}, status=409)

        password = "123"

        user = CustomUser.objects.create_user(
            username=email,
            password=password,
            role="teacher",
            name=name
        )

        Teacher.objects.create(
            user=user,
            department=department,
            class_name=class_name,
            subject=subject,
            qualifications=qualifications,
            semester=semester,
            
        )

        return Response({
            "status": "success",
            "message": "Teacher created successfully",
            "email": email,
            "default_password": "123"
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_teachers(request):

    teachers = Teacher.objects.select_related('user').all()

    data = []

    for t in teachers:
        data.append({
            "id": t.id,
            "name": t.user.name if t.user and t.user.name else "N/A", 
            "email": t.user.username if t.user else "N/A",
            "department": t.department if t.department else "N/A",
            "class_name": t.class_name if t.class_name else "N/A",
            "qualifications": t.qualifications if t.qualifications else "N/A",
            "subject": t.subject if t.subject else "N/A",
            "semester": t.semester if t.semester else "N/A"
        })

    return Response(data)

# 🔥 GET STUDENTS
@api_view(['GET'])
def get_students(request):

    students = Student.objects.select_related('user').all()

    data = []

    for s in students:
        data.append({
            "id": s.id,

            # ✅ SAFE NAME
            "name": s.user.name if s.user and s.user.name else "N/A",

            # ✅ EMAIL SAFE
            "email": s.user.username if s.user else "N/A",

            # ✅ ROLL NUMBER
            "roll_number": s.university_roll_no if s.university_roll_no else "N/A",
            "semester": s.semester if s.semester else "N/A",

            # ✅ OTHER FIELDS SAFE
            "department": s.department if s.department else "N/A",
            "class_name": s.class_name if s.class_name else "N/A",
            "father_name": s.father_name if s.father_name else "N/A",

            # ✅ DATE SAFE (IMPORTANT)
            "dob": str(s.dob) if s.dob else "N/A",
        })

    return Response(data)
# 🔥 ADD THIS IMPORT
from rest_framework.permissions import IsAuthenticated

# 🔥 NEW API → TEACHER PROFILE
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_profile(request):

    if request.user.role != "teacher":
        return Response({"error": "Only teachers allowed"}, status=403)

    try:
        teacher = Teacher.objects.get(user=request.user)
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=404)

    # 🔥 FOR NOW SINGLE VALUES (CAN EXTEND LATER)
    return Response({
        "departments": [teacher.department] if teacher.department else [],
        "classes": [teacher.class_name] if teacher.class_name else [],
        "subjects": [teacher.subject] if teacher.subject else [],
        "semesters": [teacher.semester] if teacher.semester else []
        
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_profile(request):
    try:
        student = Student.objects.select_related('user').get(user=request.user)

        return Response({
            "name": student.user.name if student.user and student.user.name else "N/A",
            "father_name": student.father_name if student.father_name else "N/A",
            "email": student.user.username if student.user else "N/A",
            "dob": str(student.dob) if student.dob else "N/A",
            "roll": student.university_roll_no if student.university_roll_no else "N/A",
            "department": student.department if student.department else "N/A",
            "className": student.class_name if student.class_name else "N/A",
            "semester": student.semester if student.semester else "N/A",
        })
    except Student.DoesNotExist:
        return Response({
            "error": "Student not found"
        }, status=404)

    except Exception as e:
        return Response({
            "error": str(e)
        }, status=500)

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def teacher_detail(request, id):
    try:
        teacher = Teacher.objects.select_related('user').get(id=id)

        # 🔵 UPDATE
        if request.method == 'PUT':
            teacher.user.name = request.data.get("name", teacher.user.name)
            teacher.user.username = request.data.get("email", teacher.user.username)

            teacher.department = request.data.get("department", teacher.department)
            teacher.class_name = request.data.get("class_name", teacher.class_name)
            teacher.subject = request.data.get("subject", teacher.subject)
            teacher.semester = request.data.get("semester", teacher.semester)

            teacher.user.save()
            teacher.save()

            return Response({"message": "Teacher updated successfully"})

        # 🔴 DELETE
        elif request.method == 'DELETE':
            teacher.user.delete()   # 🔥 deletes both user + teacher
            return Response({"message": "Teacher deleted successfully"})

    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=404)

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def student_detail(request, id):
    try:
        student = Student.objects.select_related('user').get(id=id)

        # 🔵 UPDATE
        if request.method == 'PUT':
            student.user.name = request.data.get("name", student.user.name)
            student.user.username = request.data.get("email", student.user.username)

            student.university_roll_no = request.data.get("roll_number", student.university_roll_no)
            student.dob = request.data.get("dob", student.dob)
            student.father_name = request.data.get("father_name", student.father_name)
            student.department = request.data.get("department", student.department)
            student.class_name = request.data.get("class_name", student.class_name)
            student.semester = request.data.get("semester", student.semester)

            student.user.save()
            student.save()

            return Response({"message": "Student updated successfully"})

        # 🔴 DELETE
        elif request.method == 'DELETE':
            student.user.delete()   # 🔥 deletes both user + student
            return Response({"message": "Student deleted successfully"})

    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

# 🔴 ADMIN LOGIN
@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):

    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)

    user = authenticate(username=email, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    if user.role != "admin":
        return Response({"error": "Not an admin"}, status=403)

    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "role": user.role,
        "name": user.name
    })

@api_view(['GET'])
def get_departments(request):
    from users.models import Teacher, Student

    teacher_deps = Teacher.objects.values_list('department', flat=True)
    student_deps = Student.objects.values_list('department', flat=True)

    departments = set(list(teacher_deps) + list(student_deps))

    return Response(list(departments))