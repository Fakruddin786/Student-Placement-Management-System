from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from placements.models import Company, Job


class Command(BaseCommand):
    help = 'Create the idempotent Google placement sample data for BAT-87.'

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        hr_user = User.objects.filter(email__iexact='hr@example.com').order_by('pk').first()
        if hr_user is None:
            username = 'google_hr'
            suffix = 1
            while User.objects.filter(username=username).exists():
                username = f'google_hr_{suffix}'
                suffix += 1
            hr_user = User(username=username, email='hr@example.com')
            hr_user.set_unusable_password()
            hr_user.save()

        company = Company.objects.filter(name='Google').order_by('pk').first()
        if company is None:
            if Company.objects.filter(owner=hr_user).exists():
                raise CommandError(
                    'The hr@example.com account already owns another company. '
                    'Resolve that ownership explicitly before seeding.'
                )
            company = Company.objects.create(
                owner=hr_user,
                name='Google',
                website='https://www.google.com',
                location='Bangalore',
            )
            company_created = True
        else:
            company_created = False
            if company.owner_id not in (None, hr_user.pk):
                raise CommandError(
                    'A Google company record already exists with a different owner. '
                    'Resolve that ownership explicitly before seeding.'
                )
            if company.owner_id is None:
                if Company.objects.filter(owner=hr_user).exclude(pk=company.pk).exists():
                    raise CommandError(
                        'The hr@example.com account already owns another company. '
                        'Resolve that ownership explicitly before seeding.'
                    )
                company.owner = hr_user
                company.save(update_fields=['owner', 'updated_at'])

        if company.owner_id != hr_user.pk:
            raise CommandError(
                'The hr@example.com account cannot be assigned to Google because it already owns another company.'
            )

        job_title = 'Software Engineer Intern'
        job_defaults = {
            'description': (
                'Software development internship opportunity.\n'
                'Eligibility: Computer Engineering students with CGPA above 7.0.\n'
                'Salary: 30000.'
            ),
            'location': 'Bangalore',
            'employment_type': Job.EmploymentType.INTERNSHIP,
            'min_cgpa': '7.01',
            'max_backlogs': 0,
            'application_deadline': date(2026, 10, 20),
            'is_active': True,
        }
        job, job_created = Job.objects.get_or_create(
            company=company,
            title=job_title,
            defaults=job_defaults,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Google company {"created" if company_created else "already exists"} '
                f'(id={company.pk}, contact={hr_user.email}); '
                f'{job_title} {"created" if job_created else "already exists"} (id={job.pk}).'
            )
        )
        self.stdout.write(
            self.style.WARNING(
                'Note: Company has no email field and Job has no salary or eligibility field. '
                'The HR email is represented by the built-in User who owns the company; '
                'salary and degree eligibility are recorded in the job description, with '
                'min_cgpa set to 7.01.'
            )
        )
