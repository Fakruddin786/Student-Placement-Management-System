from django.test import TestCase
from django.urls import reverse

from .models import User


class AuthenticationTests(TestCase):
	def setUp(self):
		self.password = 'Strong-pass-123'
		self.student = User.objects.create_user(
			'student@example.com', self.password, first_name='Test', role=User.Role.STUDENT
		)

	def test_registration_logs_user_in_and_routes_by_role(self):
		response = self.client.post(reverse('register'), {
			'email': 'company@example.com',
			'first_name': 'Acme',
			'last_name': 'Ltd',
			'role': User.Role.COMPANY,
			'password1': self.password,
			'password2': self.password,
		})
		self.assertEqual(response.status_code, 302)
		self.assertEqual(response['Location'], reverse('dashboard'))
		dashboard = self.client.get(reverse('dashboard'))
		self.assertEqual(dashboard.status_code, 200)
		self.assertContains(dashboard, 'Company dashboard')

	def test_registration_explains_existing_email(self):
		response = self.client.post(reverse('register'), {
			'email': self.student.email,
			'first_name': 'Other',
			'role': User.Role.COMPANY,
			'password1': self.password,
			'password2': self.password,
		})
		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'already exists')

	def test_dashboard_cards_open_authenticated_pages(self):
		self.client.force_login(self.student)
		dashboard = self.client.get(reverse('dashboard'))
		self.assertContains(dashboard, reverse('workspace'))
		self.assertContains(dashboard, reverse('account_status'))
		self.assertContains(dashboard, reverse('next_step'))
		for route in ('workspace', 'account_status', 'next_step'):
			self.assertEqual(self.client.get(reverse(route)).status_code, 200)

	def test_each_role_authenticates_and_reaches_own_dashboard(self):
		for role in User.Role.values:
			user = User.objects.create_user(f'{role}-role@example.com', self.password, role=role)
			self.client.post(reverse('logout'))
			response = self.client.post(reverse('login'), {'email': user.email, 'password': self.password})
			self.assertEqual(response.status_code, 302)
			self.assertEqual(response['Location'], reverse('dashboard'))
			dashboard = self.client.get(reverse('dashboard'))
			self.assertEqual(dashboard.status_code, 200)
			self.assertContains(dashboard, f'{role.title()} dashboard' if role != User.Role.ADMIN else 'Admin dashboard')

	def test_inactive_user_cannot_log_in(self):
		self.student.is_active = False
		self.student.save(update_fields=['is_active'])
		response = self.client.post(reverse('login'), {'email': self.student.email, 'password': self.password})
		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Invalid email or password')

	def test_logout_clears_session(self):
		self.client.force_login(self.student)
		response = self.client.post(reverse('logout'))
		self.assertRedirects(response, reverse('login'))
		self.assertNotIn('_auth_user_id', self.client.session)

	def test_non_staff_user_is_logged_out_before_switching_to_staff_login(self):
		self.client.force_login(self.student)
		response = self.client.get(reverse('login'))
		self.assertEqual(response.status_code, 200)
		self.assertNotIn('_auth_user_id', self.client.session)
		self.assertContains(response, 'Log in')

	def test_admin_login_page_allows_switching_from_non_staff_session(self):
		self.client.force_login(self.student)
		response = self.client.get('/admin/login/')
		self.assertEqual(response.status_code, 200)
		self.assertNotIn('_auth_user_id', self.client.session)
		self.assertContains(response, 'Log in')
		self.assertContains(response, 'Admin login')


class RolePermissionTests(TestCase):
	def test_role_cannot_open_another_role_dashboard(self):
		student = User.objects.create_user('student@example.com', 'Strong-pass-123', role=User.Role.STUDENT)
		self.client.force_login(student)
		response = self.client.get(reverse('admin_dashboard'))
		self.assertEqual(response.status_code, 403)

	def test_anonymous_user_is_redirected_to_login(self):
		response = self.client.get(reverse('student_dashboard'))
		self.assertEqual(response.status_code, 302)
		self.assertEqual(response['Location'], f'{reverse("login")}?next={reverse("student_dashboard")}')


class AdminManagementTests(TestCase):
	def setUp(self):
		self.admin = User.objects.create_superuser('admin@example.com', 'Strong-pass-123')
		self.managed_user = User.objects.create_user('user@example.com', 'Strong-pass-123')
		self.client.force_login(self.admin)

	def test_admin_can_view_users_and_toggle_activation(self):
		self.assertContains(self.client.get(reverse('admin_users')), self.managed_user.email)
		response = self.client.post(reverse('toggle_user_active', args=[self.managed_user.pk]))
		self.assertRedirects(response, reverse('admin_users'))
		self.managed_user.refresh_from_db()
		self.assertFalse(self.managed_user.is_active)

	def test_non_admin_cannot_manage_users(self):
		self.client.force_login(self.managed_user)
		response = self.client.get(reverse('admin_users'))
		self.assertEqual(response.status_code, 302)
		self.assertIn(reverse('login'), response.url)
