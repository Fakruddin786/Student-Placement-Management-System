from django.contrib import admin

from django.contrib.auth.admin import UserAdmin

from .models import User

admin.site.site_header = 'Admin login'
admin.site.site_title = 'Admin login'
admin.site.index_title = 'Admin login'


@admin.register(User)
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
