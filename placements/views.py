from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from profiles.models import StudentProfile

from .models import (
    Application,
    Company,
    Interview,
    Job,
    Notification,
    PlacementDrive,
    Result,
    Resume,
)
from .permissions import PlacementOwnerOrStaffPermission, ResumeOwnerOrStaffPermission
from .serializers import (
    ApplicationSerializer,
    CompanySerializer,
    InterviewSerializer,
    JobSerializer,
    NotificationSerializer,
    PlacementDriveSerializer,
    ResultSerializer,
    ResumeSerializer,
    UserSerializer,
)

User = get_user_model()


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, PlacementOwnerOrStaffPermission]

    def get_queryset(self):
        return Company.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return User.objects.all()


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated, PlacementOwnerOrStaffPermission]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Job.objects.select_related('company').all()
        return Job.objects.select_related('company').filter(
            Q(is_active=True, application_deadline__gte=timezone.localdate()) |
            Q(company__owner=self.request.user)
        )


class PlacementDriveViewSet(viewsets.ModelViewSet):
    serializer_class = PlacementDriveSerializer
    permission_classes = [IsAuthenticated, PlacementOwnerOrStaffPermission]

    def get_queryset(self):
        if self.request.user.is_staff:
            return PlacementDrive.objects.select_related('company').prefetch_related('jobs')
        return PlacementDrive.objects.select_related('company').prefetch_related('jobs').filter(
            Q(is_active=True, ends_on__gte=timezone.localdate(), registration_deadline__gte=timezone.localdate()) |
            Q(company__owner=self.request.user)
        )


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated, PlacementOwnerOrStaffPermission]

    def get_queryset(self):
        queryset = Application.objects.select_related('student__user', 'job__company', 'drive')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(
            Q(student__user=self.request.user) | Q(job__company__owner=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        profile = StudentProfile.objects.filter(user=self.request.user).first()
        if profile is None:
            raise PermissionDenied('Create a student profile before applying for a job.')
        serializer.save(student=profile)


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated, PlacementOwnerOrStaffPermission]

    def get_queryset(self):
        queryset = Interview.objects.select_related('application__student__user', 'application__job__company')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(
            Q(application__student__user=self.request.user) |
            Q(application__job__company__owner=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        application = serializer.validated_data['application']
        if not self.request.user.is_staff and application.job.company.owner_id != self.request.user.id:
            raise PermissionDenied('Only the owning company can schedule an interview.')
        serializer.save(created_by=self.request.user)


class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated, PlacementOwnerOrStaffPermission]

    def get_queryset(self):
        queryset = Result.objects.select_related('application__student__user', 'application__job__company')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(
            Q(application__student__user=self.request.user) |
            Q(application__job__company__owner=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        application = serializer.validated_data['application']
        if not self.request.user.is_staff and application.job.company.owner_id != self.request.user.id:
            raise PermissionDenied('Only the owning company can publish an application result.')
        serializer.save()


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.select_related('recipient', 'application')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated, ResumeOwnerOrStaffPermission]

    def get_queryset(self):
        queryset = Resume.objects.select_related('profile__user')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(
            Q(profile__user=self.request.user) |
            Q(profile__placement_applications__job__company__owner=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        profile = StudentProfile.objects.filter(user=self.request.user).first()
        if profile is None:
            raise PermissionDenied('Create a student profile before uploading a resume.')
        serializer.save(profile=profile)
