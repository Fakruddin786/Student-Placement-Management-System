from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required
from django.urls import path
from django.urls import reverse_lazy

from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('password/change/', auth_views.PasswordChangeView.as_view(
        template_name='accounts/password_form.html',
        success_url=reverse_lazy('password_change_done'),
        extra_context={
            'page_title': 'Change password',
            'intro_text': 'Update the password for your account.',
            'submit_label': 'Update password',
        },
    ), name='password_change'),
    path('password/change/done/', login_required(auth_views.PasswordChangeDoneView.as_view(
        template_name='accounts/password_message.html',
        extra_context={
            'page_title': 'Password changed',
            'status_message': 'Your password has been updated.',
            'action_url_name': 'dashboard',
            'action_label': 'Return to dashboard',
        },
    )), name='password_change_done'),
    path('password/reset/', auth_views.PasswordResetView.as_view(
        template_name='accounts/password_form.html',
        email_template_name='accounts/password_reset_email.txt',
        subject_template_name='accounts/password_reset_subject.txt',
        success_url=reverse_lazy('password_reset_done'),
        extra_context={
            'page_title': 'Reset password',
            'intro_text': 'Enter the email address on your account. If it matches, we will email a reset link.',
            'submit_label': 'Send reset link',
        },
    ), name='password_reset'),
    path('password/reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='accounts/password_message.html',
        extra_context={
            'page_title': 'Check your email',
            'status_message': 'If an active account matches that email, password reset instructions have been sent.',
            'action_url_name': 'login',
            'action_label': 'Return to login',
        },
    ), name='password_reset_done'),
    path('password/reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='accounts/password_form.html',
        success_url=reverse_lazy('password_reset_complete'),
        extra_context={
            'page_title': 'Choose a new password',
            'intro_text': 'Enter and confirm your new password.',
            'submit_label': 'Set new password',
            'password_reset_confirmation': True,
        },
    ), name='password_reset_confirm'),
    path('password/reset/complete/', auth_views.PasswordResetCompleteView.as_view(
        template_name='accounts/password_message.html',
        extra_context={
            'page_title': 'Password reset complete',
            'status_message': 'Your password has been reset. You can now log in with your new password.',
            'action_url_name': 'login',
            'action_label': 'Log in',
        },
    ), name='password_reset_complete'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('workspace/', views.workspace_view, name='workspace'),
    path('account-status/', views.account_status_view, name='account_status'),
    path('next-step/', views.next_step_view, name='next_step'),
    path('dashboard/student/', views.role_dashboard('student', 'Student dashboard'), name='student_dashboard'),
    path('dashboard/company/', views.role_dashboard('company', 'Company dashboard'), name='company_dashboard'),
    path('dashboard/officer/', views.role_dashboard('officer', 'Placement Officer dashboard'), name='officer_dashboard'),
    path('dashboard/admin/', views.role_dashboard('admin', 'Admin dashboard'), name='admin_dashboard'),
    path('manage/users/', views.admin_users_view, name='admin_users'),
    path('manage/users/<int:user_id>/edit/', views.edit_user_view, name='edit_user'),
    path('manage/users/<int:user_id>/toggle-active/', views.toggle_user_active, name='toggle_user_active'),
]