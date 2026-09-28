from django.urls import path

from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('workspace/', views.workspace_view, name='workspace'),
    path('account-status/', views.account_status_view, name='account_status'),
    path('next-step/', views.next_step_view, name='next_step'),
    path('dashboard/student/', views.role_dashboard('student', 'Student dashboard'), name='student_dashboard'),
    path('dashboard/company/', views.role_dashboard('company', 'Company dashboard'), name='company_dashboard'),
    path('dashboard/officer/', views.role_dashboard('officer', 'Officer dashboard'), name='officer_dashboard'),
    path('dashboard/admin/', views.role_dashboard('admin', 'Administrator dashboard'), name='admin_dashboard'),
    path('manage/users/', views.admin_users_view, name='admin_users'),
    path('manage/users/<int:user_id>/edit/', views.edit_user_view, name='edit_user'),
    path('manage/users/<int:user_id>/toggle-active/', views.toggle_user_active, name='toggle_user_active'),
]