from django.urls import include, path

urlpatterns = [
    path("api/", include("way_api.urls")),
    path("", include("way_api.web_urls")),
]

handler404 = "way_api.web_views.not_found"
