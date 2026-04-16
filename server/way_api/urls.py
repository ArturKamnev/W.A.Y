from django.urls import path

from . import views

urlpatterns = [
    path("auth/signup", views.SignupView.as_view()),
    path("auth/login", views.LoginView.as_view()),
    path("auth/logout", views.LogoutView.as_view()),
    path("auth/me", views.MeView.as_view()),
    path("test/questions", views.QuestionListView.as_view()),
    path("test/submit", views.TestSubmitView.as_view()),
    path("test/results/latest", views.LatestResultView.as_view()),
    path("test/results/<int:result_id>", views.ResultDetailView.as_view()),
    path("professions", views.ProfessionListView.as_view()),
    path("professions/saved", views.SavedProfessionListView.as_view()),
    path("professions/save", views.SaveProfessionView.as_view()),
    path("professions/save/<str:profession_id>", views.RemoveSavedProfessionView.as_view()),
    path("professions/<slug:slug>", views.ProfessionDetailView.as_view()),
    path("profile", views.ProfileView.as_view()),
    path("guide/topics", views.GuideTopicsView.as_view()),
    path("guide/conversations", views.GuideConversationListView.as_view()),
    path("guide/conversations/<int:conversation_id>/messages", views.GuideMessageView.as_view()),
    path("admin/stats", views.AdminStatsView.as_view()),
    path("admin/users", views.AdminUsersView.as_view()),
    path("admin/users/<int:user_id>", views.AdminUserDetailView.as_view()),
    path("admin/users/<int:user_id>/status", views.AdminUserStatusView.as_view()),
    path("admin/users/<int:user_id>/role", views.AdminUserRoleView.as_view()),
]
