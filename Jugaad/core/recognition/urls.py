from django.urls import path
from .views import face_attendance
from .qr_views import qr_attendance

urlpatterns = [
    path('face/', face_attendance),
    path('qr/', qr_attendance),
]