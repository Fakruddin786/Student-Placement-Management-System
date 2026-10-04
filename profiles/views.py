from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .forms import (
    CertificationForm,
    InternshipForm,
    ProjectForm,
    SkillForm,
    StudentProfileForm,
)
from .models import Certification, Internship, Project, Skill, StudentProfile
from .serializers import (
    CertificationSerializer,
    InternshipSerializer,
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
