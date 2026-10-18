from django.contrib import admin
from .models import Profile

# Register your models here.

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'birth_date')
    list_display_links = ('id', 'user')
    search_fields = ('user_username', 'phone')
    list_filter = ('birth_date',)


admin.site.register(Profile, ProfileAdmin)