from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("portfolio.urls")),
]

# Serve uploaded media (profile photo, project images). Fine for a small portfolio;
# for heavy traffic, move media to a storage service such as Cloudinary or S3.
urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

handler404 = "portfolio.views.page_not_found"
