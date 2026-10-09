from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .forms import LoginForm, RegistrationForm, UserManagementForm
from .models import User
from .permissions import permission_required


ROLE_DASHBOARD_ROUTES = {
	User.Role.STUDENT: 'student_dashboard',
	User.Role.COMPANY: 'company_dashboard',
	User.Role.OFFICER: 'officer_dashboard',
	User.Role.ADMIN: 'admin_dashboard',
}


def role_dashboard_url(user):
	return reverse(ROLE_DASHBOARD_ROUTES.get(user.role, 'dashboard'))


def register_view(request):
	if request.user.is_authenticated:
		return redirect(role_dashboard_url(request.user))
	form = RegistrationForm(request.POST or None)
	if request.method == 'POST' and form.is_valid():
		user = form.save()
		login(request, user)
		return redirect(role_dashboard_url(user))
	return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
	if request.user.is_authenticated:
		return redirect(role_dashboard_url(request.user))
	form = LoginForm(request.POST or None)
	if request.method == 'POST' and form.is_valid():
		user = authenticate(request, email=form.cleaned_data['email'], password=form.cleaned_data['password'])
		if user is None:
			form.add_error(None, 'Invalid email or password, or this account is inactive.')
		else:
			login(request, user)
			return redirect(role_dashboard_url(user))
	return render(request, 'accounts/login.html', {'form': form})


@login_required
@require_POST
def logout_view(request):
	logout(request)
	return redirect('login')


@login_required
def dashboard_view(request):
	dashboard_data = {
		User.Role.STUDENT: ('Student dashboard', 'Track your applications and opportunities.'),
		User.Role.COMPANY: ('Company dashboard', 'Manage your opportunities and connect with students.'),
		User.Role.OFFICER: ('Placement Officer dashboard', 'Review accounts and support platform activity.'),
		User.Role.ADMIN: ('Admin dashboard', 'Manage users, roles, and account access.'),
	}
	title, subtitle = dashboard_data.get(request.user.role, ('Dashboard', 'Welcome to your account portal.'))
	return render(request, 'dashboards/role_dashboard.html', {
		'title': title,
		'subtitle': subtitle,
		'role': request.user.role,
	})


@permission_required('workspace.view')
def workspace_view(request):
	return render(request, 'dashboards/tool_page.html', {
		'page_title': 'Your workspace',
		'eyebrow': 'WORKSPACE',
		'intro': 'Your student portal workspace is ready for your applications, opportunities, and activity.',
		'items': ['Applications', 'Saved opportunities', 'Recent activity'],
	})


@permission_required('account_status.view')
def account_status_view(request):
	return render(request, 'dashboards/tool_page.html', {
		'page_title': 'Account status',
		'eyebrow': 'ACCOUNT STATUS',
		'intro': 'Your account is active and you can use all available student portal features.',
		'items': ['Account: Active', f'Role: {request.user.get_role_display()}', 'Email: Verified for login'],
	})


@permission_required('next_step.view')
def next_step_view(request):
	return render(request, 'dashboards/tool_page.html', {
		'page_title': 'Next step',
		'eyebrow': 'PROFILE CHECKLIST',
		'intro': 'Keep your profile complete so the right opportunities can find you.',
		'items': ['Review your personal details', 'Add your skills and interests', 'Explore available opportunities'],
	})


def role_dashboard(role, title):
	@permission_required(f'dashboard.{role}.view')
	def dashboard(request):
		return render(request, 'dashboards/role_dashboard.html', {'title': title, 'role': role})
	return dashboard


@permission_required('users.view')
def admin_users_view(request):
	users = User.objects.order_by('email')
	return render(request, 'accounts/admin_users.html', {'users': users})


@permission_required('users.activate')
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


@permission_required('users.edit')
def edit_user_view(request, user_id):
	user = get_object_or_404(User, pk=user_id)
	form = UserManagementForm(request.POST or None, instance=user)
	if request.method == 'POST' and form.is_valid():
		form.save()
		messages.success(request, 'User updated successfully.')
		return redirect('admin_users')
	return render(request, 'accounts/edit_user.html', {'form': form, 'managed_user': user})
