from django.urls import path

from way_api import web_views

app_name = "web"

urlpatterns = [
    path("", web_views.home, name="home"),
    path("about/", web_views.about, name="about"),
    path("onboarding/", web_views.onboarding, name="onboarding"),
    path("login/", web_views.login_view, name="login"),
    path("signup/", web_views.signup_view, name="signup"),
    path("language/", web_views.set_language, name="set_language"),
    path("logout/", web_views.logout_view, name="logout"),
    path("professions/", web_views.professions, name="professions"),
    path("professions/<slug:slug>/", web_views.profession_detail, name="profession_detail"),
    path("professions/<slug:slug>/save/", web_views.toggle_profession, name="toggle_profession"),
    path("test/", web_views.career_test, name="test"),
    path("results/", web_views.latest_result, name="results"),
    path("results/<int:result_id>/", web_views.result_detail, name="result_detail"),
    path("guide/", web_views.guide, name="guide"),
    path("guide/<int:conversation_id>/message/", web_views.guide_message, name="guide_message"),
    path("profile/", web_views.profile, name="profile"),
    path("way-admin/", web_views.admin_dashboard, name="admin"),
    path("way-admin/users/<int:user_id>/status/", web_views.admin_user_status, name="admin_user_status"),
    path("way-admin/users/<int:user_id>/role/", web_views.admin_user_role, name="admin_user_role"),
]
