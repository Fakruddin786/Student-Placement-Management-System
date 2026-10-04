from django.urls import path

from .page_views import job_board

urlpatterns = [
    path('', job_board, name='placement_job_board'),
]
