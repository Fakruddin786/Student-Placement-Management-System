from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationViewSet,
    CertificationViewSet,
    CompanyProfileViewSet,
    InternshipViewSet,
    JobPostingViewSet,
    PlacementNotificationViewSet,
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
router.register(r'companies', CompanyProfileViewSet, basename='company')
router.register(r'jobs', JobPostingViewSet, basename='job')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'notifications', PlacementNotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]

