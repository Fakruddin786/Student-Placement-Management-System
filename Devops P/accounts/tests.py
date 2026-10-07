import re
from urllib.parse import urlsplit

from django.conf import settings
from django.core import mail
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from .models import User
from .permissions import ROLE_PERMISSIONS, user_has_permission


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
		self.assertEqual(response['Location'], reverse('company_dashboard'))
		dashboard = self.client.get(response['Location'])
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

	def test_registration_rejects_weak_passwords(self):
		response = self.client.post(reverse('register'), {
			'email': 'weak-password@example.com',
			'first_name': 'Weak',
			'role': User.Role.STUDENT,
			'password1': 'short',
			'password2': 'short',
		})
		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.context['form'].errors['password2'])
		self.assertFalse(User.objects.filter(email='weak-password@example.com').exists())

	def test_registration_cannot_assign_admin_role(self):
		response = self.client.post(reverse('register'), {
			'email': 'public-admin@example.com',
			'first_name': 'Public',
			'role': User.Role.ADMIN,
			'password1': self.password,
			'password2': self.password,
		})
		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.context['form'].errors['role'])
		self.assertFalse(User.objects.filter(email='public-admin@example.com').exists())

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
			dashboard_routes = {
				User.Role.STUDENT: 'student_dashboard',
				User.Role.COMPANY: 'company_dashboard',
				User.Role.OFFICER: 'officer_dashboard',
				User.Role.ADMIN: 'admin_dashboard',
			}
			self.assertEqual(response['Location'], reverse(dashboard_routes[role]))
			dashboard = self.client.get(response['Location'])
			self.assertEqual(dashboard.status_code, 200)
			dashboard_titles = {
				User.Role.STUDENT: 'Student dashboard',
				User.Role.COMPANY: 'Company dashboard',
				User.Role.OFFICER: 'Placement Officer dashboard',
				User.Role.ADMIN: 'Admin dashboard',
			}
			self.assertContains(dashboard, dashboard_titles[role])

	def test_login_uses_role_dashboard_instead_of_next_parameter(self):
		response = self.client.post(
			reverse('login') + '?next=' + reverse('admin_dashboard'),
			{'email': self.student.email, 'password': self.password},
		)
		self.assertRedirects(response, reverse('student_dashboard'), fetch_redirect_response=False)

	def test_login_rotates_an_existing_session_key(self):
		session = self.client.session
		session['pre_authentication_value'] = 'preserved'
		session.save()
		previous_session_key = session.session_key

		response = self.client.post(reverse('login'), {
			'email': self.student.email,
			'password': self.password,
		})

		self.assertEqual(response.status_code, 302)
		self.assertNotEqual(self.client.session.session_key, previous_session_key)

	def test_inactive_user_cannot_log_in(self):
		self.student.is_active = False
		self.student.save(update_fields=['is_active'])
		response = self.client.post(reverse('login'), {'email': self.student.email, 'password': self.password})
		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Invalid email or password')

	def test_deactivated_user_is_blocked_from_an_existing_session(self):
		self.client.force_login(self.student)
		self.assertEqual(self.client.get(reverse('student_dashboard')).status_code, 200)
		self.student.is_active = False
		self.student.save(update_fields=['is_active'])

		response = self.client.get(reverse('student_dashboard'))
		self.assertEqual(response.status_code, 302)
		self.assertEqual(
			response['Location'],
			f'{reverse("login")}?next={reverse("student_dashboard")}',
		)

	def test_logout_clears_session(self):
		self.client.force_login(self.student)
		self.assertEqual(self.client.get(reverse('logout')).status_code, 405)
		response = self.client.post(reverse('logout'))
		self.assertRedirects(response, reverse('login'))
		self.assertNotIn('_auth_user_id', self.client.session)

	def test_logout_requires_a_valid_csrf_token(self):
		client = Client(enforce_csrf_checks=True)
		client.force_login(self.student)
		self.assertEqual(client.post(reverse('logout')).status_code, 403)

		page = client.get(reverse('dashboard'))
		match = re.search(r'name="csrfmiddlewaretoken" value="([^"]+)"', page.content.decode())
		self.assertIsNotNone(match)
		response = client.post(reverse('logout'), {'csrfmiddlewaretoken': match.group(1)})
		self.assertRedirects(response, reverse('login'))
		self.assertNotIn('_auth_user_id', client.session)

	def test_session_timeout_and_cookie_security_settings(self):
		self.assertEqual(settings.SESSION_COOKIE_AGE, 30 * 60)
		self.assertTrue(settings.SESSION_EXPIRE_AT_BROWSER_CLOSE)
		self.assertTrue(settings.SESSION_SAVE_EVERY_REQUEST)
		self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
		self.assertEqual(settings.SESSION_COOKIE_SAMESITE, 'Lax')
		self.assertEqual(settings.CSRF_COOKIE_SAMESITE, 'Lax')

		self.client.force_login(self.student)
		response = self.client.get(reverse('dashboard'))
		session_cookie = response.cookies[settings.SESSION_COOKIE_NAME]
		self.assertTrue(session_cookie['httponly'])
		self.assertEqual(session_cookie['samesite'], 'Lax')
		self.assertEqual(bool(session_cookie['secure']), settings.SESSION_COOKIE_SECURE)
		csrf_cookie = response.cookies[settings.CSRF_COOKIE_NAME]
		self.assertEqual(bool(csrf_cookie['secure']), settings.CSRF_COOKIE_SECURE)

	def test_authenticated_user_cannot_be_logged_out_by_visiting_login(self):
		self.client.force_login(self.student)
		response = self.client.get(reverse('login'))
		self.assertRedirects(response, reverse('student_dashboard'))
		self.assertIn('_auth_user_id', self.client.session)

	def test_admin_login_page_does_not_log_out_non_admin_by_get(self):
		self.client.force_login(self.student)
		response = self.client.get('/admin/login/')
		self.assertRedirects(response, reverse('dashboard'))
		self.assertIn('_auth_user_id', self.client.session)

		self.client.post(reverse('logout'))
		response = self.client.get('/admin/login/')
		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Log in')
		self.assertContains(response, 'Admin login')


class RolePermissionTests(TestCase):
	def test_private_routes_require_authentication(self):
		private_routes = (
			'dashboard',
			'workspace',
			'account_status',
			'next_step',
			'student_dashboard',
			'company_dashboard',
			'officer_dashboard',
			'admin_dashboard',
			'password_change',
			'password_change_done',
			'admin_users',
		)
		for route in private_routes:
			with self.subTest(route=route):
				response = self.client.get(reverse(route))
				self.assertEqual(response.status_code, 302)
				self.assertTrue(response.url.startswith(reverse('login')))

		for route in ('edit_user', 'toggle_user_active'):
			with self.subTest(route=route):
				response = self.client.get(reverse(route, args=[1]))
				self.assertEqual(response.status_code, 302)
				self.assertTrue(response.url.startswith(reverse('login')))

	def test_permissions_are_explicitly_defined_for_each_role(self):
		self.assertEqual(set(ROLE_PERMISSIONS), set(User.Role.values))
		all_permissions = set().union(*ROLE_PERMISSIONS.values())
		for role, permissions in ROLE_PERMISSIONS.items():
			user = User.objects.create_user(f'{role}@example.com', 'Strong-pass-123', role=role)
			for permission in all_permissions:
				with self.subTest(role=role, permission=permission):
					self.assertEqual(user_has_permission(user, permission), permission in permissions)
			self.assertFalse(user_has_permission(user, 'permission.not.registered'))

	def test_each_role_can_open_only_its_own_dashboard(self):
		dashboard_routes = {
			User.Role.STUDENT: 'student_dashboard',
			User.Role.COMPANY: 'company_dashboard',
			User.Role.OFFICER: 'officer_dashboard',
			User.Role.ADMIN: 'admin_dashboard',
		}
		for role, own_route in dashboard_routes.items():
			user = User.objects.create_user(f'{role}@example.com', 'Strong-pass-123', role=role)
			self.client.force_login(user)
			for target_role, route in dashboard_routes.items():
				with self.subTest(role=role, target_role=target_role):
					response = self.client.get(reverse(route))
					self.assertEqual(response.status_code, 200 if route == own_route else 403)

	def test_student_pages_are_restricted_to_students(self):
		for role in (User.Role.COMPANY, User.Role.OFFICER, User.Role.ADMIN):
			user = User.objects.create_user(f'{role}@example.com', 'Strong-pass-123', role=role)
			self.client.force_login(user)
			for route in ('workspace', 'account_status', 'next_step'):
				with self.subTest(role=role, route=route):
					self.assertEqual(self.client.get(reverse(route)).status_code, 403)

	def test_staff_flag_does_not_grant_admin_role_permissions(self):
		staff_user = User.objects.create_user(
			'staff@example.com', 'Strong-pass-123', role=User.Role.STUDENT, is_staff=True
		)
		self.client.force_login(staff_user)
		self.assertEqual(self.client.get(reverse('admin_users')).status_code, 403)
		self.assertEqual(self.client.get(reverse('admin:index')).status_code, 302)

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
		self.assertEqual(self.client.get(reverse('admin:index')).status_code, 200)
		response = self.client.post(reverse('toggle_user_active', args=[self.managed_user.pk]))
		self.assertRedirects(response, reverse('admin_users'))
		self.managed_user.refresh_from_db()
		self.assertFalse(self.managed_user.is_active)
		self.assertContains(self.client.get(reverse('admin_users')), 'Activate')

		response = self.client.post(reverse('toggle_user_active', args=[self.managed_user.pk]))
		self.assertRedirects(response, reverse('admin_users'))
		self.managed_user.refresh_from_db()
		self.assertTrue(self.managed_user.is_active)

	def test_non_admin_cannot_manage_users(self):
		self.client.force_login(self.managed_user)
		self.assertEqual(self.client.get(reverse('admin_users')).status_code, 403)
		self.assertEqual(
			self.client.get(reverse('edit_user', args=[self.managed_user.pk])).status_code,
			403,
		)
		self.assertEqual(
			self.client.post(reverse('toggle_user_active', args=[self.managed_user.pk])).status_code,
			403,
		)
		self.managed_user.refresh_from_db()
		self.assertTrue(self.managed_user.is_active)


@override_settings(
	EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
	DEFAULT_FROM_EMAIL='portal@example.com',
)
class PasswordSecurityTests(TestCase):
	def setUp(self):
		self.password = 'Strong-pass-123'
		self.user = User.objects.create_user('password@example.com', self.password, first_name='Password')

	def test_password_change_validates_new_password_and_keeps_session(self):
		self.client.force_login(self.user)
		response = self.client.post(reverse('password_change'), {
			'old_password': self.password,
			'new_password1': 'short',
			'new_password2': 'short',
		})
		self.assertEqual(response.status_code, 200)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password(self.password))

		new_password = 'Different-Strong-456'
		response = self.client.post(reverse('password_change'), {
			'old_password': self.password,
			'new_password1': new_password,
			'new_password2': new_password,
		})
		self.assertRedirects(response, reverse('password_change_done'))
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password(new_password))
		self.assertEqual(self.client.get(reverse('student_dashboard')).status_code, 200)

	def test_password_reset_email_link_sets_new_password(self):
		response = self.client.post(reverse('password_reset'), {'email': self.user.email})
		self.assertRedirects(response, reverse('password_reset_done'))
		self.assertEqual(len(mail.outbox), 1)
		self.assertIn(self.user.email, mail.outbox[0].to)

		match = re.search(r'http://testserver\S+', mail.outbox[0].body)
		self.assertIsNotNone(match)
		reset_path = urlsplit(match.group(0)).path
		confirm_response = self.client.get(reset_path, follow=True)
		self.assertEqual(confirm_response.status_code, 200)
		confirm_path = confirm_response.request['PATH_INFO']

		new_password = 'Reset-Strong-456'
		response = self.client.post(confirm_path, {
			'new_password1': new_password,
			'new_password2': new_password,
		})
		self.assertRedirects(response, reverse('password_reset_complete'))
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password(new_password))

	def test_passwords_are_stored_as_hashes(self):
		self.assertNotEqual(self.user.password, self.password)
		self.assertTrue(self.user.check_password(self.password))

	def test_invalid_reset_token_cannot_change_password(self):
		from django.utils.encoding import force_bytes
		from django.utils.http import urlsafe_base64_encode

		uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
		reset_path = reverse('password_reset_confirm', kwargs={
			'uidb64': uidb64,
			'token': 'invalid-token',
		})
		new_password = 'Tampered-Strong-456'
		response = self.client.post(reset_path, {
			'new_password1': new_password,
			'new_password2': new_password,
		})
		self.assertEqual(response.status_code, 200)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password(self.password))

	def test_password_reset_does_not_disclose_unknown_emails(self):
		response = self.client.post(reverse('password_reset'), {'email': 'unknown@example.com'})
		self.assertRedirects(response, reverse('password_reset_done'))
		self.assertEqual(len(mail.outbox), 0)
