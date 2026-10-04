from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CertificationViewSet,
    InternshipViewSet,
    ProjectViewSet,
    SkillViewSet,
    StudentProfileViewSet,
)

router = DefaultRouter()
router.register(r'profile', StudentProfileViewSet, basename='profile')
router.register(r'students', StudentProfileViewSet, basename='student')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'certifications', CertificationViewSet, basename='certification')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'internships', InternshipViewSet, basename='internship')

urlpatterns = [
    path('', include(router.urls)),
]
