from django.contrib import admin
from .models import CustomUser, Student, Teacher

admin.site.register(CustomUser)
admin.site.register(Student)
admin.site.register(Teacher)