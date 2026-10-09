from functools import wraps

from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponseForbidden

from .models import User


ROLE_PERMISSIONS = {
	User.Role.STUDENT: frozenset({
		'dashboard.student.view',
		'workspace.view',
		'account_status.view',
		'next_step.view',
	}),
	User.Role.COMPANY: frozenset({
		'dashboard.company.view',
	}),
	User.Role.OFFICER: frozenset({
		'dashboard.officer.view',
	}),
	User.Role.ADMIN: frozenset({
		'dashboard.admin.view',
		'users.view',
		'users.edit',
		'users.activate',
		'admin.site.access',
	}),
}


def user_has_permission(user, permission):
	if not user.is_authenticated or not user.is_active:
		return False
	return permission in ROLE_PERMISSIONS.get(user.role, ())


def permission_required(permission):
	def decorator(view_func):
		@wraps(view_func)
		def wrapped(request, *args, **kwargs):
			if not request.user.is_authenticated:
				return redirect_to_login(request.get_full_path())
			if not user_has_permission(request.user, permission):
				return HttpResponseForbidden('You do not have permission to access this page.')
			return view_func(request, *args, **kwargs)
		return wrapped
	return decorator