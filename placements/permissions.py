from .models import Application
from rest_framework.permissions import SAFE_METHODS, BasePermission


class PlacementOwnerOrStaffPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        if isinstance(obj, Application) and obj.student.user_id == request.user.id:
            return True

        company = getattr(obj, 'company', None)
        if company is None and hasattr(obj, 'owner_id'):
            return obj.owner_id == request.user.id
        if company is None and hasattr(obj, 'job'):
            company = getattr(obj.job, 'company', None)
        if company is None and hasattr(obj, 'application'):
            company = getattr(obj.application.job, 'company', None)
        return company is not None and company.owner_id == request.user.id


class ResumeOwnerOrStaffPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff or obj.profile.user_id == request.user.id
