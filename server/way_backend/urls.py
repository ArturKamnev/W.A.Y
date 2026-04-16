from django.urls import include, path

urlpatterns = [
    path("api/", include("way_api.urls")),
]
