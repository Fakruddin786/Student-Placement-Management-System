import csv

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .forms import (
    ApplicationStatusForm,
    CertificationForm,
    CompanyProfileForm,
    InternshipForm,
    JobPostingForm,
    NotificationForm,
    ProjectForm,
    SkillForm,
    StudentProfileForm,
)
from .models import (
    Application,
    Certification,
    CompanyProfile,
    Internship,
    JobPosting,
    PlacementNotification,
    PlacementOfficerProfile,
    Project,
    Skill,
    StudentProfile,
)
from .serializers import (
    ApplicationSerializer,
    CertificationSerializer,
    CompanyProfileSerializer,
    InternshipSerializer,
    JobPostingSerializer,
    PlacementNotificationSerializer,
    ProjectSerializer,
    SkillSerializer,
    StudentProfileSerializer,
)


def root_redirect(request):
    if request.user.is_authenticated:
        return redirect('profile_form')
    return redirect('login')


def login_view(request):
    if request.user.is_authenticated:
        return redirect('profile_form')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('profile_form')
        messages.error(request, 'Invalid username or password.')

    return render(request, 'profiles/login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def profile_form(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        form = StudentProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile saved successfully.')
            return redirect('profile_detail')
    else:
        form = StudentProfileForm(instance=profile)

    return render(request, 'profiles/profile.html', {'form': form, 'profile': profile})


@login_required
def profile_detail(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    return render(
        request,
        'profiles/profile_detail.html',
        {
            'profile': profile,
            'skills': profile.skills.all(),
            'certifications': profile.certifications.all(),
            'projects': profile.projects.all(),
            'internships': profile.internships.all(),
        },
    )


@login_required
def skill_add(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = SkillForm(request.POST)
        if form.is_valid():
            skill = form.save(commit=False)
            skill.profile = profile
            skill.save()
            messages.success(request, 'Skill added successfully.')
            return redirect('profile_detail')
    else:
        form = SkillForm()
    return render(request, 'profiles/skill_form.html', {'form': form, 'title': 'Add Skill', 'cancel_url': 'profile_detail'})


@login_required
def skill_edit(request, pk):
    skill = get_object_or_404(Skill, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        form = SkillForm(request.POST, instance=skill)
        if form.is_valid():
            form.save()
            messages.success(request, 'Skill updated successfully.')
            return redirect('profile_detail')
    else:
        form = SkillForm(instance=skill)
    return render(request, 'profiles/skill_form.html', {'form': form, 'title': 'Edit Skill', 'cancel_url': 'profile_detail'})


@login_required
def skill_delete(request, pk):
    skill = get_object_or_404(Skill, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        skill.delete()
        messages.success(request, 'Skill deleted successfully.')
        return redirect('profile_detail')
    return render(request, 'profiles/confirm_delete.html', {'object': skill, 'cancel_url': 'profile_detail'})


@login_required
def certification_add(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = CertificationForm(request.POST)
        if form.is_valid():
            cert = form.save(commit=False)
            cert.profile = profile
            cert.save()
            messages.success(request, 'Certification added successfully.')
            return redirect('profile_detail')
    else:
        form = CertificationForm()
    return render(request, 'profiles/certification_form.html', {'form': form, 'title': 'Add Certification', 'cancel_url': 'profile_detail'})


@login_required
def certification_edit(request, pk):
    cert = get_object_or_404(Certification, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        form = CertificationForm(request.POST, instance=cert)
        if form.is_valid():
            form.save()
            messages.success(request, 'Certification updated successfully.')
            return redirect('profile_detail')
    else:
        form = CertificationForm(instance=cert)
    return render(request, 'profiles/certification_form.html', {'form': form, 'title': 'Edit Certification', 'cancel_url': 'profile_detail'})


@login_required
def certification_delete(request, pk):
    cert = get_object_or_404(Certification, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        cert.delete()
        messages.success(request, 'Certification deleted successfully.')
        return redirect('profile_detail')
    return render(request, 'profiles/confirm_delete.html', {'object': cert, 'cancel_url': 'profile_detail'})


@login_required
def project_add(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = form.save(commit=False)
            project.profile = profile
            project.save()
            messages.success(request, 'Project added successfully.')
            return redirect('profile_detail')
    else:
        form = ProjectForm()
    return render(request, 'profiles/project_form.html', {'form': form, 'title': 'Add Project', 'cancel_url': 'profile_detail'})


@login_required
def project_edit(request, pk):
    project = get_object_or_404(Project, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            messages.success(request, 'Project updated successfully.')
            return redirect('profile_detail')
    else:
        form = ProjectForm(instance=project)
    return render(request, 'profiles/project_form.html', {'form': form, 'title': 'Edit Project', 'cancel_url': 'profile_detail'})


@login_required
def project_delete(request, pk):
    project = get_object_or_404(Project, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        project.delete()
        messages.success(request, 'Project deleted successfully.')
        return redirect('profile_detail')
    return render(request, 'profiles/confirm_delete.html', {'object': project, 'cancel_url': 'profile_detail'})


@login_required
def internship_add(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = InternshipForm(request.POST)
        if form.is_valid():
            internship = form.save(commit=False)
            internship.profile = profile
            internship.save()
            messages.success(request, 'Internship added successfully.')
            return redirect('profile_detail')
    else:
        form = InternshipForm()
    return render(request, 'profiles/internship_form.html', {'form': form, 'title': 'Add Internship', 'cancel_url': 'profile_detail'})


@login_required
def internship_edit(request, pk):
    internship = get_object_or_404(Internship, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        form = InternshipForm(request.POST, instance=internship)
        if form.is_valid():
            form.save()
            messages.success(request, 'Internship updated successfully.')
            return redirect('profile_detail')
    else:
        form = InternshipForm(instance=internship)
    return render(request, 'profiles/internship_form.html', {'form': form, 'title': 'Edit Internship', 'cancel_url': 'profile_detail'})


@login_required
def internship_delete(request, pk):
    internship = get_object_or_404(Internship, pk=pk, profile__user=request.user)
    if request.method == 'POST':
        internship.delete()
        messages.success(request, 'Internship deleted successfully.')
        return redirect('profile_detail')
    return render(request, 'profiles/confirm_delete.html', {'object': internship, 'cancel_url': 'profile_detail'})


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudentProfile.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        if StudentProfile.objects.filter(user=request.user).exists():
            from rest_framework.response import Response
            return Response(
                {'detail': 'You already have a student profile. Use PUT or PATCH to update it.'},
                status=400,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Skill.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class CertificationViewSet(viewsets.ModelViewSet):
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certification.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class InternshipViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Internship.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


# --- Dashboards & Placement Views ---

@login_required
def dashboard_home(request):
    """Router view directing users to their appropriate dashboard based on role."""
    if request.user.is_superuser or request.user.is_staff or hasattr(request.user, 'officer_profile'):
        return redirect('officer_dashboard')
    elif hasattr(request.user, 'company_profile'):
        return redirect('company_dashboard')
    else:
        return redirect('student_dashboard')


@login_required
def student_dashboard(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    applications = Application.objects.filter(student=profile).select_related('job', 'job__company').order_by('-applied_at')
    
    applied_job_ids = applications.values_list('job_id', flat=True)
    all_jobs = JobPosting.objects.filter(status='Open').select_related('company').order_by('-created_at')
    
    available_jobs = []
    for job in all_jobs:
        already_applied = job.id in applied_job_ids
        is_cgpa_eligible = profile.cgpa >= job.min_cgpa
        is_backlog_eligible = profile.backlogs <= job.max_backlogs
        
        dept_eligible = True
        if job.eligible_departments and job.eligible_departments.lower() != 'all':
            depts = [d.strip().lower() for d in job.eligible_departments.split(',')]
            dept_eligible = profile.department.strip().lower() in depts
            
        eligible = is_cgpa_eligible and is_backlog_eligible and dept_eligible
        available_jobs.append({
            'job': job,
            'already_applied': already_applied,
            'eligible': eligible,
        })
        
    notifications = PlacementNotification.objects.filter(user=request.user).order_by('-created_at')
    unread_notifications_count = notifications.filter(is_read=False).count()
    placed_application = applications.filter(status='Placed').first()
    
    context = {
        'profile': profile,
        'applications': applications,
        'available_jobs': available_jobs,
        'notifications': notifications[:5],
        'unread_notifications_count': unread_notifications_count,
        'placed_application': placed_application,
        'total_applications_count': applications.count(),
        'interviews_count': applications.filter(status='Interview Scheduled').count(),
    }
    return render(request, 'profiles/student_dashboard.html', context)


@login_required
def company_dashboard(request):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={'company_name': request.user.username}
    )
    jobs = JobPosting.objects.filter(company=company).order_by('-created_at')
    applications = Application.objects.filter(job__company=company).select_related('student', 'student__user', 'job').order_by('-applied_at')
    
    context = {
        'company': company,
        'jobs': jobs,
        'applications': applications,
        'total_jobs': jobs.count(),
        'total_applications': applications.count(),
        'total_shortlisted': applications.filter(status='Shortlisted').count(),
        'total_placed': applications.filter(status='Placed').count(),
    }
    return render(request, 'profiles/company_dashboard.html', context)


@login_required
def officer_dashboard(request):
    total_students = StudentProfile.objects.count()
    total_companies = CompanyProfile.objects.count()
    total_applications = Application.objects.count()
    total_placed_students = StudentProfile.objects.filter(applications__status='Placed').distinct().count()
    placement_rate = round((total_placed_students / total_students * 100), 2) if total_students > 0 else 0.0
    
    departments = StudentProfile.objects.values_list('department', flat=True).distinct()
    dept_stats = []
    for dept in sorted(list(filter(None, departments))):
        students_in_dept = StudentProfile.objects.filter(department=dept)
        dept_total = students_in_dept.count()
        dept_placed = students_in_dept.filter(applications__status='Placed').distinct().count()
        dept_unplaced = dept_total - dept_placed
        dept_rate = round((dept_placed / dept_total * 100), 2) if dept_total > 0 else 0.0
        
        placed_apps = Application.objects.filter(student__department=dept, status='Placed')
        avg_pkg = placed_apps.aggregate(Avg('job__package_lpa'))['job__package_lpa__avg'] or 0.0
        
        dept_stats.append({
            'department': dept,
            'total_students': dept_total,
            'placed_students': dept_placed,
            'unplaced_students': dept_unplaced,
            'placement_rate': dept_rate,
            'avg_package': round(float(avg_pkg), 2),
        })

    companies = CompanyProfile.objects.all()
    company_stats = []
    for comp in companies:
        comp_jobs = comp.job_postings.all()
        comp_apps = Application.objects.filter(job__company=comp)
        comp_placed = comp_apps.filter(status='Placed').count()
        comp_interviews = comp_apps.filter(status='Interview Scheduled').count()
        avg_pkg = comp_jobs.aggregate(Avg('package_lpa'))['package_lpa__avg'] or 0.0
        
        company_stats.append({
            'company_name': comp.company_name,
            'jobs_posted': comp_jobs.count(),
            'total_applications': comp_apps.count(),
            'interviews': comp_interviews,
            'placed': comp_placed,
            'avg_package': round(float(avg_pkg), 2),
        })

    chart_dept_labels = [ds['department'] for ds in dept_stats]
    chart_dept_rates = [ds['placement_rate'] for ds in dept_stats]
    chart_dept_placed = [ds['placed_students'] for ds in dept_stats]
    chart_dept_unplaced = [ds['unplaced_students'] for ds in dept_stats]
    
    app_status_counts = {
        'Applied': Application.objects.filter(status='Applied').count(),
        'Shortlisted': Application.objects.filter(status='Shortlisted').count(),
        'Interview_Scheduled': Application.objects.filter(status='Interview Scheduled').count(),
        'Placed': Application.objects.filter(status='Placed').count(),
        'Rejected': Application.objects.filter(status='Rejected').count(),
    }
    
    context = {
        'total_students': total_students,
        'total_companies': total_companies,
        'total_applications': total_applications,
        'total_placed_students': total_placed_students,
        'placement_rate': placement_rate,
        'dept_stats': dept_stats,
        'company_stats': company_stats,
        'chart_dept_labels': chart_dept_labels,
        'chart_dept_rates': chart_dept_rates,
        'chart_dept_placed': chart_dept_placed,
        'chart_dept_unplaced': chart_dept_unplaced,
        'app_status_counts': app_status_counts,
    }
    return render(request, 'profiles/officer_dashboard.html', context)


@login_required
def apply_job(request, job_id):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    job = get_object_or_404(JobPosting, pk=job_id, status='Open')

    if request.method == 'POST':
        app, created = Application.objects.get_or_create(student=profile, job=job)
        if created:
            messages.success(request, f'Successfully applied for {job.title} at {job.company.company_name}.')
            PlacementNotification.objects.create(
                user=job.company.user,
                title='New Application Received',
                message=f'Student {request.user.username} applied for {job.title}.',
                notification_type='Application',
            )
        else:
            messages.info(request, f'You have already applied for {job.title}.')
    return redirect('student_dashboard')


@login_required
def job_posting_create(request):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={'company_name': request.user.username}
    )
    if request.method == 'POST':
        form = JobPostingForm(request.POST)
        if form.is_valid():
            job = form.save(commit=False)
            job.company = company
            job.save()
            messages.success(request, 'Job posting created successfully.')
            return redirect('company_dashboard')
    else:
        form = JobPostingForm()
    return render(request, 'profiles/job_posting_form.html', {'form': form, 'title': 'Create Job Drive', 'cancel_url': 'company_dashboard'})


@login_required
def update_application_status(request, app_id):
    application = get_object_or_404(Application, pk=app_id)
    is_company_owner = hasattr(request.user, 'company_profile') and application.job.company == request.user.company_profile
    is_officer = request.user.is_superuser or request.user.is_staff or hasattr(request.user, 'officer_profile')
    
    if not (is_company_owner or is_officer):
        messages.error(request, 'You do not have permission to update this application.')
        return redirect('dashboard_home')

    if request.method == 'POST':
        form = ApplicationStatusForm(request.POST, instance=application)
        if form.is_valid():
            app = form.save()
            
            notif_title = f"Application Status Update: {app.job.title}"
            notif_msg = f"Your application status for {app.job.title} at {app.job.company.company_name} has been updated to '{app.status}'."
            if app.interview_date:
                notif_msg += f" Interview Date: {app.interview_date.strftime('%Y-%m-%d %H:%M')}."
            if app.interview_notes:
                notif_msg += f" Notes: {app.interview_notes}"
                
            notif_type = 'Placement' if app.status == 'Placed' else ('Interview' if app.status == 'Interview Scheduled' else 'Application')
            
            PlacementNotification.objects.create(
                user=app.student.user,
                title=notif_title,
                message=notif_msg,
                notification_type=notif_type,
            )
            
            messages.success(request, f'Updated status for {app.student.user.username} to {app.status}.')
            if is_company_owner:
                return redirect('company_dashboard')
            else:
                return redirect('officer_dashboard')
    else:
        form = ApplicationStatusForm(instance=application)

    return render(
        request,
        'profiles/application_status_form.html',
        {
            'form': form,
            'application': application,
            'title': f'Update Application - {application.student.user.username}',
            'cancel_url': 'company_dashboard' if is_company_owner else 'officer_dashboard',
        },
    )


@login_required
def placement_notifications(request):
    notifications = PlacementNotification.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'profiles/notifications.html', {'notifications': notifications})


@login_required
def mark_notification_read(request, notif_id):
    notif = get_object_or_404(PlacementNotification, pk=notif_id, user=request.user)
    notif.is_read = True
    notif.save()
    messages.success(request, 'Notification marked as read.')
    return redirect('placement_notifications')


@login_required
def placement_reports(request):
    applications = Application.objects.select_related('student', 'student__user', 'job', 'job__company').order_by('-applied_at')
    
    status_filter = request.GET.get('status', '')
    dept_filter = request.GET.get('department', '')
    
    if status_filter:
        applications = applications.filter(status=status_filter)
    if dept_filter:
        applications = applications.filter(student__department__iexact=dept_filter)
        
    departments = StudentProfile.objects.values_list('department', flat=True).distinct()
    
    context = {
        'applications': applications,
        'departments': sorted(list(filter(None, departments))),
        'selected_status': status_filter,
        'selected_dept': dept_filter,
        'statuses': [choice[0] for choice in Application.STATUS_CHOICES],
    }
    return render(request, 'profiles/placement_reports.html', context)


@login_required
def placement_report_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="placement_report.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Student Username',
        'Phone',
        'Department',
        'Branch',
        'CGPA',
        'Backlogs',
        'Company',
        'Job Title',
        'Package (LPA)',
        'Status',
        'Applied Date',
        'Interview Date',
    ])

    applications = Application.objects.select_related('student', 'student__user', 'job', 'job__company').order_by('-applied_at')
    
    status_filter = request.GET.get('status', '')
    dept_filter = request.GET.get('department', '')
    
    if status_filter:
        applications = applications.filter(status=status_filter)
    if dept_filter:
        applications = applications.filter(student__department__iexact=dept_filter)

    for app in applications:
        student = app.student
        job = app.job
        writer.writerow([
            student.user.username,
            student.phone,
            student.department,
            student.branch,
            str(student.cgpa),
            student.backlogs,
            job.company.company_name,
            job.title,
            str(job.package_lpa),
            app.status,
            app.applied_at.strftime('%Y-%m-%d'),
            app.interview_date.strftime('%Y-%m-%d %H:%M') if app.interview_date else 'N/A',
        ])

    return response


# --- REST API ViewSets ---

class CompanyProfileViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompanyProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class JobPostingViewSet(viewsets.ModelViewSet):
    serializer_class = JobPostingSerializer
    permission_classes = [IsAuthenticated]
    queryset = JobPosting.objects.all()


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'company_profile'):
            return Application.objects.filter(job__company=user.company_profile)
        elif hasattr(user, 'student_profile') or hasattr(user, 'studentprofile'):
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            return Application.objects.filter(student=profile)
        return Application.objects.all()


class PlacementNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = PlacementNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PlacementNotification.objects.filter(user=self.request.user).order_by('-created_at')

