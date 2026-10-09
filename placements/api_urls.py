from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationViewSet,
    CompanyViewSet,
    InterviewViewSet,
    JobViewSet,
    NotificationViewSet,
    PlacementDriveViewSet,
    ResumeViewSet,
    ResultViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'users', UserViewSet, basename='user')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'placement-drives', PlacementDriveViewSet, basename='placement-drive')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'results', ResultViewSet, basename='result')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'resumes', ResumeViewSet, basename='resume')

urlpatterns = [path('', include(router.urls))]
