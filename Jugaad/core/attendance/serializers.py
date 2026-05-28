from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord


class AttendanceSessionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(
        source="teacher.name",
        read_only=True
    )

    class Meta:
        model = AttendanceSession
        fields = "__all__"


class AttendanceRecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceRecord
        fields = "__all__"