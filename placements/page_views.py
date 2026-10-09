from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from profiles.models import StudentProfile


@login_required
def job_board(request):
    student_profile = StudentProfile.objects.filter(user=request.user).only('id').first()
    return render(
        request,
        'placements/job_board.html',
        {'student_profile_id': student_profile.pk if student_profile else ''},
    )
