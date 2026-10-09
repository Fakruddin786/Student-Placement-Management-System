import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from accounts.models import User

user = User.objects.filter(email="admin@example.com").first()
if user is None:
    User.objects.create_superuser(
        email="admin@example.com",
        password="Admin123!",
        first_name="Admin",
        last_name="User",
    )
    print("created")
else:
    user.is_staff = True
    user.is_superuser = True
    user.role = User.Role.ADMIN
    user.set_password("Admin123!")
    user.save()
    print("updated")
