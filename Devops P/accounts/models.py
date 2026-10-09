from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
	def create_user(self, email, password=None, **extra_fields):
		if not email:
			raise ValueError('An email address is required.')
		user = self.model(email=self.normalize_email(email), **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, email, password=None, **extra_fields):
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		extra_fields.setdefault('role', User.Role.ADMIN)
		if not extra_fields['is_staff'] or not extra_fields['is_superuser']:
			raise ValueError('Superusers must have staff and superuser permissions.')
		return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
	class Role(models.TextChoices):
		STUDENT = 'student', 'Student'
		COMPANY = 'company', 'Company'
		OFFICER = 'officer', 'Placement Officer'
		ADMIN = 'admin', 'Admin'

	email = models.EmailField(unique=True)
	first_name = models.CharField(max_length=150)
	last_name = models.CharField(max_length=150, blank=True)
	role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)
	date_joined = models.DateTimeField(auto_now_add=True)

	objects = UserManager()

	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = []

	def __str__(self):
		return self.email
