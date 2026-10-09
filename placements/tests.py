from datetime import timedelta
from io import StringIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from profiles.models import StudentProfile

from .models import Application, Company, Job, PlacementDrive

User = get_user_model()


class PlacementApiTests(APITestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        media_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        media_override.enable()
        self.addCleanup(media_override.disable)
        self.addCleanup(self.media_directory.cleanup)

        self.student_user = User.objects.create_user(username='student', password='pass12345')
        self.student = StudentProfile.objects.create(user=self.student_user)
        self.company_user = User.objects.create_user(username='employer', password='pass12345')
        self.company = Company.objects.create(owner=self.company_user, name='Example Corp')
        self.other_user = User.objects.create_user(username='other', password='pass12345')
        self.other_student = StudentProfile.objects.create(user=self.other_user)

        self.job = Job.objects.create(
            company=self.company,
            title='Backend Engineer',
            description='Build APIs',
            location='Remote',
            employment_type=Job.EmploymentType.FULL_TIME,
            application_deadline=timezone.localdate() + timedelta(days=30),
        )
        self.drive = PlacementDrive.objects.create(
            company=self.company,
            title='Autumn drive',
            starts_on=timezone.localdate() + timedelta(days=35),
            ends_on=timezone.localdate() + timedelta(days=36),
            registration_deadline=timezone.localdate() + timedelta(days=30),
        )
        self.drive.jobs.add(self.job)

    def test_company_job_drive_and_application_crud(self):
        self.client.force_authenticate(self.company_user)
        new_company_owner = User.objects.create_user(username='new-employer', password='pass12345')
        self.client.force_authenticate(new_company_owner)
        response = self.client.post(reverse('company-list'), {'name': 'New Company'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['owner'], new_company_owner.pk)
        self.client.force_authenticate(self.company_user)

        response = self.client.post(
            reverse('job-list'),
            {
                'company': self.company.pk,
                'title': 'QA Engineer',
                'description': 'Test applications',
                'location': 'Remote',
                'employment_type': 'full_time',
                'min_cgpa': '8.00',
                'max_backlogs': 0,
                'application_deadline': str(timezone.localdate() + timedelta(days=20)),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created_job_id = response.data['id']
        self.assertEqual(
            self.client.patch(
                reverse('job-detail', args=[created_job_id]),
                {'title': 'Senior QA Engineer'},
                format='json',
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.delete(reverse('job-detail', args=[created_job_id])).status_code,
            status.HTTP_204_NO_CONTENT,
        )

        response = self.client.post(
            reverse('placement-drive-list'),
            {
                'company': self.company.pk,
                'jobs': [self.job.pk],
                'title': 'New drive',
                'starts_on': str(timezone.localdate() + timedelta(days=45)),
                'ends_on': str(timezone.localdate() + timedelta(days=46)),
                'registration_deadline': str(timezone.localdate() + timedelta(days=40)),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.client.force_authenticate(self.student_user)
        payload = {'job': self.job.pk, 'drive': self.drive.pk, 'cover_letter': 'I am interested.'}
        response = self.client.post(reverse('application-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        application_id = response.data['id']
        self.assertEqual(response.data['student'], self.student.pk)
        list_response = self.client.get(reverse('application-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['id'], application_id)
        self.assertEqual(
            self.client.post(reverse('application-list'), payload, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        detail_response = self.client.get(reverse('application-detail', args=[application_id]))
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data['id'], application_id)
        self.assertEqual(
            self.client.patch(
                reverse('application-detail', args=[application_id]),
                {'cover_letter': 'Updated letter'},
                format='json',
            ).status_code,
            status.HTTP_200_OK,
        )
        response = self.client.patch(
            reverse('application-detail', args=[application_id]),
            {'status': Application.Status.SHORTLISTED},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], Application.Status.SUBMITTED)

    def test_company_owner_can_update_application_status_and_manage_interview_and_result(self):
        application = Application.objects.create(student=self.student, job=self.job, drive=self.drive)
        self.client.force_authenticate(self.company_user)
        response = self.client.patch(
            reverse('application-detail', args=[application.pk]),
            {'status': Application.Status.SHORTLISTED},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        response = self.client.post(
            reverse('interview-list'),
            {
                'application': application.pk,
                'scheduled_at': (timezone.now() + timedelta(days=2)).isoformat(),
                'mode': 'online',
                'meeting_url': 'https://meet.example.test/interview',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        interview_id = response.data['id']
        self.assertEqual(
            self.client.patch(
                reverse('interview-detail', args=[interview_id]),
                {'status': 'completed'},
                format='json',
            ).status_code,
            status.HTTP_200_OK,
        )

        response = self.client.post(
            reverse('result-list'),
            {'application': application.pk, 'status': 'selected', 'offered_salary': '75000.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(
            self.client.patch(
                reverse('result-detail', args=[response.data['id']]),
                {'comments': 'Offer approved'},
                format='json',
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.post(
                reverse('result-list'),
                {'application': application.pk, 'status': 'rejected'},
                format='json',
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_data_and_wrong_company_relationships_are_rejected(self):
        self.client.force_authenticate(self.company_user)
        response = self.client.post(
            reverse('job-list'),
            {
                'company': self.company.pk,
                'title': 'Invalid job',
                'description': 'Invalid CGPA',
                'location': 'Remote',
                'employment_type': 'not-a-status',
                'min_cgpa': '10.01',
                'max_backlogs': 0,
                'application_deadline': 'not-a-date',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(
            reverse('placement-drive-list'),
            {
                'company': self.company.pk,
                'jobs': [self.job.pk],
                'title': 'Invalid dates',
                'starts_on': str(timezone.localdate() + timedelta(days=20)),
                'ends_on': str(timezone.localdate() + timedelta(days=10)),
                'registration_deadline': str(timezone.localdate() + timedelta(days=21)),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            reverse('application-list'),
            {'job': self.job.pk, 'status': 'not-a-status'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(
            reverse('application-list'),
            {'job': self.job.pk, 'drive': None},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        other_job = Job.objects.create(
            company=self.company,
            title='Data analyst',
            description='Analyze data',
            location='Remote',
            employment_type=Job.EmploymentType.FULL_TIME,
            application_deadline=timezone.localdate() + timedelta(days=25),
        )
        self.client.force_authenticate(self.other_user)
        response = self.client.post(
            reverse('application-list'),
            {'job': other_job.pk, 'drive': self.drive.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            self.client.get(reverse('application-list')).data,
            [],
        )

    def test_staff_can_list_and_retrieve_all_applications(self):
        application = Application.objects.create(student=self.student, job=self.job)
        staff_user = User.objects.create_user(username='placement-staff', password='pass12345', is_staff=True)
        self.client.force_authenticate(staff_user)

        list_response = self.client.get(reverse('application-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['id'] for item in list_response.data], [application.pk])

        detail_response = self.client.get(reverse('application-detail', args=[application.pk]))
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data['id'], application.pk)

    def test_company_writes_are_limited_to_the_company_owner(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.patch(
            reverse('job-detail', args=[self.job.pk]),
            {'title': 'Unauthorized change'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_notifications_and_resumes_are_private_and_validate_uploads(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            reverse('notification-list'),
            {'title': 'Application received', 'message': 'We received your application.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['recipient'], self.student_user.pk)
        notification_id = response.data['id']
        self.assertEqual(
            self.client.patch(
                reverse('notification-detail', args=[notification_id]),
                {'is_read': True},
                format='json',
            ).status_code,
            status.HTTP_200_OK,
        )

        response = self.client.post(
            reverse('resume-list'),
            {
                'title': 'Primary resume',
                'is_default': 'true',
                'file': SimpleUploadedFile('resume.pdf', b'%PDF-1.4', content_type='application/pdf'),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['profile'], self.student.pk)

        response = self.client.post(
            reverse('resume-list'),
            {
                'title': 'Wrong format',
                'file': SimpleUploadedFile('resume.txt', b'plain text', content_type='text/plain'),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get(reverse('notification-list')).data, [])
        self.assertEqual(self.client.get(reverse('resume-list')).data, [])

    def test_students_must_meet_job_eligibility(self):
        self.job.min_cgpa = 5
        self.job.save()
        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            reverse('application-list'),
            {'job': self.job.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student', response.data)

    def test_anonymous_requests_are_rejected_and_existing_students_route_is_available(self):
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get(reverse('job-list')).status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])

        self.client.force_authenticate(self.student_user)
        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_user_crud_is_staff_only_and_passwords_are_hashed(self):
        self.client.force_authenticate(self.student_user)
        self.assertEqual(self.client.get(reverse('user-list')).status_code, status.HTTP_403_FORBIDDEN)

        staff_user = User.objects.create_user(username='placement-admin', password='pass12345', is_staff=True)
        self.client.force_authenticate(staff_user)
        response = self.client.post(
            reverse('user-list'),
            {'username': 'api-user', 'email': 'api-user@example.test', 'password': 'Strong-pass-987'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertNotIn('password', response.data)
        created_user = User.objects.get(username='api-user')
        self.assertTrue(created_user.check_password('Strong-pass-987'))

        response = self.client.patch(
            reverse('user-detail', args=[created_user.pk]),
            {'password': 'Different-pass-654'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        created_user.refresh_from_db()
        self.assertTrue(created_user.check_password('Different-pass-654'))

        self.assertEqual(
            self.client.delete(reverse('user-detail', args=[created_user.pk])).status_code,
            status.HTTP_204_NO_CONTENT,
        )


class PlacementFrontendTests(APITestCase):
    def test_job_board_requires_login(self):
        response = self.client.get(reverse('placement_job_board'))
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn(reverse('login'), response.url)

    def test_authenticated_job_board_uses_existing_apis_and_styles(self):
        user = User.objects.create_user(username='board-student', password='pass12345')
        self.client.force_login(user)
        response = self.client.get(reverse('placement_job_board'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, reverse('job-list'))
        self.assertContains(response, reverse('company-detail', args=[0]))
        self.assertContains(response, reverse('application-list'))
        self.assertContains(response, 'profiles/styles.css')
        self.assertContains(response, 'placements/job_board.js')
        self.assertContains(response, reverse('profile_form'))


class Bat87SeedCommandTests(APITestCase):
    def test_seed_command_creates_expected_data_and_is_idempotent(self):
        call_command('seed_bat87_placement_data', stdout=StringIO())
        call_command('seed_bat87_placement_data', stdout=StringIO())

        company = Company.objects.get(name='Google')
        job = Job.objects.get(company=company, title='Software Engineer Intern')
        self.assertEqual(company.owner.email, 'hr@example.com')
        self.assertEqual(company.location, 'Bangalore')
        self.assertEqual(company.website, 'https://www.google.com')
        self.assertEqual(job.description, (
            'Software development internship opportunity.\n'
            'Eligibility: Computer Engineering students with CGPA above 7.0.\n'
            'Salary: 30000.'
        ))
        self.assertEqual(str(job.min_cgpa), '7.01')
        self.assertEqual(job.location, 'Bangalore')
        self.assertEqual(job.application_deadline.isoformat(), '2026-10-20')
        self.assertEqual(Company.objects.filter(name='Google').count(), 1)
        self.assertEqual(Job.objects.filter(company=company, title='Software Engineer Intern').count(), 1)
