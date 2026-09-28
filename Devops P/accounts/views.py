from functools import wraps

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .forms import LoginForm, RegistrationForm, UserManagementForm
from .models import User


def register_view(request):
	if request.user.is_authenticated:
		return redirect('dashboard')
	form = RegistrationForm(request.POST or None)
	if request.method == 'POST' and form.is_valid():
		user = form.save()
		login(request, user)
		return redirect('dashboard')
	return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
	if request.user.is_authenticated:
		if request.user.is_staff or request.user.role == User.Role.ADMIN:
			return redirect('dashboard')
		logout(request)
	form = LoginForm(request.POST or None)
	if request.method == 'POST' and form.is_valid():
		user = authenticate(request, email=form.cleaned_data['email'], password=form.cleaned_data['password'])
		if user is None:
			form.add_error(None, 'Invalid email or password, or this account is inactive.')
		else:
			login(request, user)
			return redirect(request.GET.get('next') or reverse('dashboard'))
	return render(request, 'accounts/login.html', {'form': form})


@login_required
def logout_view(request):
	logout(request)
	return redirect('login')


@login_required
def dashboard_view(request):
	dashboard_data = {
		User.Role.STUDENT: ('Student dashboard', 'Track your applications and opportunities.'),
		User.Role.COMPANY: ('Company dashboard', 'Manage your opportunities and connect with students.'),
		User.Role.OFFICER: ('Officer dashboard', 'Review accounts and support platform activity.'),
		User.Role.ADMIN: ('Admin dashboard', 'Manage users, roles, and account access.'),
	}
	title, subtitle = dashboard_data.get(request.user.role, ('Dashboard', 'Welcome to your account portal.'))
	return render(request, 'dashboards/role_dashboard.html', {
		'title': title,
		'subtitle': subtitle,
		'role': request.user.role,
	})


@login_required
def workspace_view(request):
	return render(request, 'dashboards/tool_page.html', {
		'page_title': 'Your workspace',
		'eyebrow': 'WORKSPACE',
		'intro': 'Your student portal workspace is ready for your applications, opportunities, and activity.',
		'items': ['Applications', 'Saved opportunities', 'Recent activity'],
	})


@login_required
def account_status_view(request):
	return render(request, 'dashboards/tool_page.html', {
		'page_title': 'Account status',
		'eyebrow': 'ACCOUNT STATUS',
		'intro': 'Your account is active and you can use all available student portal features.',
		'items': ['Account: Active', f'Role: {request.user.get_role_display()}', 'Email: Verified for login'],
	})


@login_required
def next_step_view(request):
	return render(request, 'dashboards/tool_page.html', {
		'page_title': 'Next step',
		'eyebrow': 'PROFILE CHECKLIST',
		'intro': 'Keep your profile complete so the right opportunities can find you.',
		'items': ['Review your personal details', 'Add your skills and interests', 'Explore available opportunities'],
	})


def role_required(*roles):
	def decorator(view_func):
		@wraps(view_func)
		def wrapped(request, *args, **kwargs):
			if not request.user.is_authenticated:
				return redirect_to_login(request.get_full_path())
			if request.user.role not in roles:
				return HttpResponseForbidden('You do not have permission to access this page.')
			return view_func(request, *args, **kwargs)
		return wrapped
	return decorator


def role_dashboard(role, title):
	@role_required(role)
	def dashboard(request):
		return render(request, 'dashboards/role_dashboard.html', {'title': title, 'role': role})
	return dashboard


@user_passes_test(lambda user: user.is_authenticated and (user.is_staff or user.role == User.Role.ADMIN))
def admin_users_view(request):
	users = User.objects.order_by('email')
	return render(request, 'accounts/admin_users.html', {'users': users})


@user_passes_test(lambda user: user.is_authenticated and (user.is_staff or user.role == User.Role.ADMIN))
def toggle_user_active(request, user_id):
	if request.method != 'POST':
		return HttpResponseForbidden('Only POST requests can change account status.')
	user = get_object_or_404(User, pk=user_id)
	if user == request.user:
		messages.error(request, 'You cannot deactivate your own account.')
	else:
		user.is_active = not user.is_active
		user.save(update_fields=['is_active'])
		messages.success(request, f'{user.email} is now {"active" if user.is_active else "inactive"}.')
	return redirect('admin_users')


@user_passes_test(lambda user: user.is_authenticated and (user.is_staff or user.role == User.Role.ADMIN))
def edit_user_view(request, user_id):
	user = get_object_or_404(User, pk=user_id)
	form = UserManagementForm(request.POST or None, instance=user)
	if request.method == 'POST' and form.is_valid():
		form.save()
		messages.success(request, 'User updated successfully.')
		return redirect('admin_users')
	return render(request, 'accounts/edit_user.html', {'form': form, 'managed_user': user})
