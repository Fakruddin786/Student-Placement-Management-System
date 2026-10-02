from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .forms import StudentProfileForm
from .models import Certification, Internship, Project, Skill, StudentProfile

User = get_user_model()


class StudentProfileFormTests(TestCase):
    def test_profile_creation_success(self):
        user = User.objects.create_user(username='alice', password='secret123')
        self.client.force_login(user)
        response = self.client.post(
            reverse('profile_form'),
            {
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '8.75',
                'backlogs': '1',
            },
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())

    def test_empty_required_fields_are_rejected(self):
        user = User.objects.create_user(username='emptyuser', password='secret123')
        self.client.force_login(user)
        response = self.client.post(
            reverse('profile_form'),
            {
                'phone': '',
                'department': '',
                'branch': '',
                'cgpa': '',
                'backlogs': '',
            },
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'This field is required.')

    def test_cgpa_below_zero_invalid(self):
        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '-1',
                'backlogs': '0',
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn('CGPA must be between 0 and 10.', form.errors['cgpa'])

    def test_cgpa_above_ten_invalid(self):
        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '10.01',
                'backlogs': '0',
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn('CGPA must be between 0 and 10.', form.errors['cgpa'])

    def test_cgpa_valid(self):
        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '9.5',
                'backlogs': '0',
            }
        )
        self.assertTrue(form.is_valid(), form.errors)

    def test_phone_validation(self):
        invalid_cases = ['12345', '98765abc', '987654321', '98765432101', '987-654-3210']
        for value in invalid_cases:
            form = StudentProfileForm(
                data={
                    'phone': value,
                    'department': 'CSE',
                    'branch': 'Computer Science',
                    'cgpa': '8.5',
                    'backlogs': '0',
                }
            )
            self.assertFalse(form.is_valid(), value)

        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '8.5',
                'backlogs': '0',
            }
        )
        self.assertTrue(form.is_valid(), form.errors)

    def test_backlogs_negative_invalid(self):
        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '8.5',
                'backlogs': '-1',
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn('Backlogs cannot be negative.', form.errors['backlogs'])

    def test_resume_validation(self):
        valid_files = [
            ('resume.pdf', b'%PDF-1.4', 'application/pdf'),
            ('resume.doc', b'contents', 'application/msword'),
            ('resume.docx', b'PK\x03\x04', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ]
        for name, data, content_type in valid_files:
            form = StudentProfileForm(
                data={
                    'phone': '9876543210',
                    'department': 'CSE',
                    'branch': 'Computer Science',
                    'cgpa': '8.5',
                    'backlogs': '0',
                },
                files={'resume': SimpleUploadedFile(name, data, content_type)},
            )
            self.assertTrue(form.is_valid(), form.errors)

        invalid = SimpleUploadedFile('resume.txt', b'hello world', 'text/plain')
        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '8.5',
                'backlogs': '0',
            },
            files={'resume': invalid},
        )
        self.assertFalse(form.is_valid())
        self.assertIn('Unsupported file type.', form.errors['resume'])

        large_data = b'a' * (6 * 1024 * 1024)
        big_file = SimpleUploadedFile('large.pdf', large_data, 'application/pdf')
        form = StudentProfileForm(
            data={
                'phone': '9876543210',
                'department': 'CSE',
                'branch': 'Computer Science',
                'cgpa': '8.5',
                'backlogs': '0',
            },
            files={'resume': big_file},
        )
        self.assertFalse(form.is_valid())
        self.assertIn('Resume file size must be 5 MB or less.', form.errors['resume'])


class AuthAndAccessTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='alpha', password='secret123')
        self.user_b = User.objects.create_user(username='beta', password='secret123')
        self.profile_b = StudentProfile.objects.create(
            user=self.user_b,
            phone='1111111111',
            department='ECE',
            branch='Electronics',
            cgpa='8.00',
            backlogs=0,
        )

    def test_login_required_redirect(self):
        response = self.client.get(reverse('profile_form'))
        self.assertRedirects(response, '/login/?next=/profile/')

    def test_login_success_and_invalid(self):
        success_client = self.client_class()
        success = success_client.post(reverse('login'), {'username': 'alpha', 'password': 'secret123'})
        self.assertRedirects(success, reverse('profile_form'))

        invalid_client = self.client_class()
        invalid = invalid_client.post(reverse('login'), {'username': 'alpha', 'password': 'wrongpass'})
        self.assertContains(invalid, 'Invalid username or password.')

    def test_user_cannot_access_other_profile(self):
        self.client.force_login(self.user_a)
        response = self.client.get(reverse('profile_detail'))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, self.profile_b.department)

        response = self.client.get('/profile/view/?id=99999')
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, self.profile_b.department)

    def test_root_redirects_unauthenticated_and_authenticated_users(self):
        unauth_response = self.client.get('/')
        self.assertRedirects(unauth_response, reverse('login'))

        self.client.force_login(self.user_a)
        auth_response = self.client.get('/')
        self.assertRedirects(auth_response, reverse('profile_form'))


class CRUDTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='student', password='secret123')
        self.client.force_login(self.user)
        self.profile = StudentProfile.objects.create(
            user=self.user,
            phone='9876543210',
            department='CSE',
            branch='Computer Science',
            cgpa='8.50',
            backlogs=1,
        )

    def test_profile_detail_contains_all_expected_fields(self):
        self.profile.resume = SimpleUploadedFile('resume.pdf', b'%PDF-1.4', 'application/pdf')
        self.profile.save()
        Skill.objects.create(profile=self.profile, name='Python')
        Certification.objects.create(profile=self.profile, name='AWS', issuer='Amazon', year=2024)
        Project.objects.create(profile=self.profile, title='Portfolio', description='A learning app', technologies='Django, Python')
        Internship.objects.create(profile=self.profile, company='Google', role='SWE Intern', duration='3 months', description='Worked on backend systems')

        response = self.client.get(reverse('profile_detail'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.user.username)
        self.assertContains(response, '9876543210')
        self.assertContains(response, 'CSE')
        self.assertContains(response, 'Computer Science')
        self.assertContains(response, '8.50')
        self.assertContains(response, '1')
        self.assertContains(response, 'Python')
        self.assertContains(response, 'AWS')
        self.assertContains(response, 'Portfolio')
        self.assertContains(response, 'Google')
        self.assertContains(response, 'View Resume')

    def test_empty_form_data_is_rejected_for_related_models(self):
        invalid_payloads = {
            'skill_add': {'name': ''},
            'certification_add': {'name': '', 'issuer': '', 'year': ''},
            'project_add': {'title': '', 'description': '', 'technologies': ''},
            'internship_add': {'company': '', 'role': '', 'duration': '', 'description': ''},
        }
        for name, payload in invalid_payloads.items():
            response = self.client.post(reverse(name), payload)
            self.assertEqual(response.status_code, 200)
            self.assertContains(response, 'required')

    def test_skill_crud(self):
        response = self.client.post(reverse('skill_add'), {'name': 'Django'}, follow=True)
        self.assertEqual(response.status_code, 200)
        skill = self.profile.skills.get()
        self.assertEqual(skill.name, 'Django')

        response = self.client.post(reverse('skill_edit', args=[skill.id]), {'name': 'Python'}, follow=True)
        self.assertRedirects(response, reverse('profile_detail'))
        skill.refresh_from_db()
        self.assertEqual(skill.name, 'Python')

        response = self.client.post(reverse('skill_delete', args=[skill.id]), follow=True)
        self.assertContains(response, 'Skill deleted successfully.')
        self.assertFalse(self.profile.skills.filter(pk=skill.pk).exists())

    def test_certification_crud(self):
        response = self.client.post(reverse('certification_add'), {'name': 'AWS', 'issuer': 'Amazon', 'year': '2024'}, follow=True)
        self.assertEqual(response.status_code, 200)
        cert = self.profile.certifications.get()
        self.assertEqual(cert.name, 'AWS')

        response = self.client.post(reverse('certification_edit', args=[cert.id]), {'name': 'Azure', 'issuer': 'Microsoft', 'year': '2025'}, follow=True)
        cert.refresh_from_db()
        self.assertEqual(cert.name, 'Azure')

        response = self.client.post(reverse('certification_delete', args=[cert.id]), follow=True)
        self.assertFalse(self.profile.certifications.filter(pk=cert.pk).exists())

    def test_project_crud(self):
        response = self.client.post(reverse('project_add'), {'title': 'Portfolio', 'description': 'A full stack app', 'technologies': 'Python, Django'}, follow=True)
        self.assertEqual(response.status_code, 200)
        project = self.profile.projects.get()
        self.assertEqual(project.title, 'Portfolio')

        response = self.client.post(reverse('project_edit', args=[project.id]), {'title': 'Updated project', 'description': 'Updated description', 'technologies': 'Django'}, follow=True)
        project.refresh_from_db()
        self.assertEqual(project.title, 'Updated project')

        response = self.client.post(reverse('project_delete', args=[project.id]), follow=True)
        self.assertFalse(self.profile.projects.filter(pk=project.pk).exists())

    def test_internship_crud(self):
        response = self.client.post(reverse('internship_add'), {'company': 'Acme', 'role': 'Intern', 'duration': '2 months', 'description': 'Worked on backend.'}, follow=True)
        self.assertEqual(response.status_code, 200)
        internship = self.profile.internships.get()
        self.assertEqual(internship.company, 'Acme')

        response = self.client.post(reverse('internship_edit', args=[internship.id]), {'company': 'Beta', 'role': 'Developer', 'duration': '3 months', 'description': 'Updated role'}, follow=True)
        internship.refresh_from_db()
        self.assertEqual(internship.company, 'Beta')

        response = self.client.post(reverse('internship_delete', args=[internship.id]), follow=True)
        self.assertFalse(self.profile.internships.filter(pk=internship.pk).exists())


class UserOwnershipSecurityTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='owner_a', password='secret123')
        self.user_b = User.objects.create_user(username='owner_b', password='secret123')
        self.profile_b = StudentProfile.objects.create(
            user=self.user_b,
            phone='2222222222',
            department='ME',
            branch='Mechanical',
            cgpa='7.50',
            backlogs=2,
        )
        self.skill_b = Skill.objects.create(profile=self.profile_b, name='Welding')
        self.cert_b = Certification.objects.create(profile=self.profile_b, name='Safety', issuer='Campus', year=2023)
        self.project_b = Project.objects.create(profile=self.profile_b, title='Machine', description='Test', technologies='Steel')
        self.intern_b = Internship.objects.create(profile=self.profile_b, company='Forge', role='Engineer', duration='3 months', description='Machining')

    def test_user_a_cannot_edit_or_delete_user_b_records(self):
        self.client.force_login(self.user_a)
        protected_routes = [
            ('skill_edit', self.skill_b.id, {'name': 'Changed'}),
            ('skill_delete', self.skill_b.id, {}),
            ('certification_edit', self.cert_b.id, {'name': 'Changed', 'issuer': 'Campus', 'year': 2024}),
            ('certification_delete', self.cert_b.id, {}),
            ('project_edit', self.project_b.id, {'title': 'Changed', 'description': 'Updated', 'technologies': 'Steel'}),
            ('project_delete', self.project_b.id, {}),
            ('internship_edit', self.intern_b.id, {'company': 'Forge', 'role': 'Senior', 'duration': '4 months', 'description': 'Updated'}),
            ('internship_delete', self.intern_b.id, {}),
        ]
        for route_name, pk, payload in protected_routes:
            if 'delete' in route_name:
                response = self.client.post(reverse(route_name, args=[pk]), follow=True)
            else:
                response = self.client.post(reverse(route_name, args=[pk]), payload, follow=True)
            self.assertIn(response.status_code, [404, 403])


class APIViewsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='apiuser', password='secret123')
        self.client.force_authenticate(user=self.user)
        self.profile = StudentProfile.objects.create(
            user=self.user,
            phone='9876543210',
            department='CSE',
            branch='Computer Science',
            cgpa='8.90',
            backlogs=2,
        )
        self.skill = Skill.objects.create(profile=self.profile, name='Django')
        self.certification = Certification.objects.create(profile=self.profile, name='AWS', issuer='Amazon', year=2024)
        self.project = Project.objects.create(profile=self.profile, title='Portfolio', description='App', technologies='Django')
        self.internship = Internship.objects.create(profile=self.profile, company='A', role='Developer', duration='3 months', description='Worked')

    def test_api_get(self):
        response = self.client.get(reverse('profile-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['department'], 'CSE')

        response = self.client.get(reverse('skill-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_api_post_and_update_delete(self):
        profile_response = self.client.post(
            reverse('profile-list'),
            {'phone': '1234567890', 'department': 'IT', 'branch': 'Information Tech', 'cgpa': '9.0', 'backlogs': '0'},
            format='json',
        )
        self.assertEqual(profile_response.status_code, status.HTTP_400_BAD_REQUEST)

        skill_response = self.client.post(reverse('skill-list'), {'name': 'REST'}, format='json')
        self.assertEqual(skill_response.status_code, status.HTTP_201_CREATED)

        skill_detail = self.client.patch(reverse('skill-detail', args=[self.skill.id]), {'name': 'API'}, format='json')
        self.assertEqual(skill_detail.status_code, status.HTTP_200_OK)

        delete_response = self.client.delete(reverse('project-detail', args=[self.project.id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

    def test_api_unauthenticated_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse('profile-list'))
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class UserIsolationAPITests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='a', password='secret123')
        self.user_b = User.objects.create_user(username='b', password='secret123')
        self.profile_b = StudentProfile.objects.create(
            user=self.user_b,
            phone='2222222222',
            department='ME',
            branch='Mechanical',
            cgpa='7.50',
            backlogs=3,
        )
        self.skill_b = Skill.objects.create(profile=self.profile_b, name='Welding')
        self.cert_b = Certification.objects.create(profile=self.profile_b, name='Safety', issuer='Campus', year=2023)
        self.project_b = Project.objects.create(profile=self.profile_b, title='Machine', description='Test', technologies='Steel')
        self.intern_b = Internship.objects.create(profile=self.profile_b, company='Forge', role='Engineer', duration='3 months', description='Machining')

    def test_user_a_cannot_access_user_b_records(self):
        self.client.force_authenticate(user=self.user_a)

        profile_response = self.client.get(reverse('profile-detail', args=[self.profile_b.id]))
        self.assertIn(profile_response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        skill_response = self.client.get(reverse('skill-detail', args=[self.skill_b.id]))
        self.assertIn(skill_response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        cert_response = self.client.get(reverse('certification-detail', args=[self.cert_b.id]))
        self.assertIn(cert_response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        project_response = self.client.get(reverse('project-detail', args=[self.project_b.id]))
        self.assertIn(project_response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        internship_response = self.client.get(reverse('internship-detail', args=[self.intern_b.id]))
        self.assertIn(internship_response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])
