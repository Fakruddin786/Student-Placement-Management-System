from django.contrib import admin

from django.contrib.auth.admin import UserAdmin

from .models import User
from .permissions import user_has_permission

class RoleAdminSite(admin.AdminSite):
	def has_permission(self, request):
		user = request.user
		return user.is_staff and user_has_permission(user, 'admin.site.access')


class CustomUserAdmin(UserAdmin):
	ordering = ('email',)
	list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff')
	list_filter = ('role', 'is_active', 'is_staff')
	search_fields = ('email', 'first_name', 'last_name')
	fieldsets = (
		(None, {'fields': ('email', 'password')}),
		('Personal info', {'fields': ('first_name', 'last_name', 'role')}),
		('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
		('Important dates', {'fields': ('last_login', 'date_joined')}),
	)
	add_fieldsets = (
		(None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2', 'role', 'is_staff', 'is_active')}),
	)


role_admin_site = RoleAdminSite(name='admin')
role_admin_site.site_header = 'Admin login'
role_admin_site.site_title = 'Admin login'
role_admin_site.index_title = 'Admin login'
role_admin_site.register(User, CustomUserAdmin)
