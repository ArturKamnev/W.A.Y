CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE "GuideMessageRole" AS ENUM ('user', 'assistant', 'system');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "gradeOrAge" TEXT,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'ru',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profession" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "titleRu" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionRu" TEXT NOT NULL,
  "descriptionEn" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "skills" TEXT[],
  "fitTags" TEXT[],
  "details" JSONB NOT NULL,
  "scoringTags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestQuestion" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "textRu" TEXT NOT NULL,
  "textEn" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'single_choice',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestQuestionOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "labelRu" TEXT NOT NULL,
  "labelEn" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "scoringPayload" JSONB NOT NULL,
  "sort_order" INTEGER NOT NULL,
  CONSTRAINT "TestQuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "status" "AttemptStatus" NOT NULL DEFAULT 'in_progress',
  CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestAnswer" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionId" TEXT NOT NULL,
  "numericValue" INTEGER,
  "payloadSnapshot" JSONB,
  CONSTRAINT "TestAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestResult" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "summaryRu" TEXT NOT NULL,
  "summaryEn" TEXT NOT NULL,
  "strengths" JSONB NOT NULL,
  "workStyle" JSONB NOT NULL,
  "preferredEnvironment" JSONB NOT NULL,
  "recommendedDirections" JSONB NOT NULL,
  "roadmap" JSONB NOT NULL,
  "aiExplanationRu" TEXT,
  "aiExplanationEn" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResultRecommendation" (
  "id" TEXT NOT NULL,
  "resultId" TEXT NOT NULL,
  "professionId" TEXT NOT NULL,
  "matchPercent" INTEGER NOT NULL,
  "reasonRu" TEXT NOT NULL,
  "reasonEn" TEXT NOT NULL,
  CONSTRAINT "ResultRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedProfession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "professionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedProfession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuideConversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuideConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuideMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "GuideMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuideMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "Profession_slug_key" ON "Profession"("slug");
CREATE INDEX "Profession_category_idx" ON "Profession"("category");
CREATE UNIQUE INDEX "TestQuestion_sort_order_key" ON "TestQuestion"("sort_order");
CREATE INDEX "TestQuestion_category_idx" ON "TestQuestion"("category");
CREATE UNIQUE INDEX "TestQuestionOption_questionId_sort_order_key" ON "TestQuestionOption"("questionId", "sort_order");
CREATE INDEX "TestAttempt_userId_status_idx" ON "TestAttempt"("userId", "status");
CREATE UNIQUE INDEX "TestAnswer_attemptId_questionId_key" ON "TestAnswer"("attemptId", "questionId");
CREATE UNIQUE INDEX "TestResult_attemptId_key" ON "TestResult"("attemptId");
CREATE INDEX "TestResult_userId_createdAt_idx" ON "TestResult"("userId", "createdAt");
CREATE UNIQUE INDEX "ResultRecommendation_resultId_professionId_key" ON "ResultRecommendation"("resultId", "professionId");
CREATE UNIQUE INDEX "SavedProfession_userId_professionId_key" ON "SavedProfession"("userId", "professionId");
CREATE INDEX "GuideConversation_userId_updatedAt_idx" ON "GuideConversation"("userId", "updatedAt");
CREATE INDEX "GuideMessage_conversationId_createdAt_idx" ON "GuideMessage"("conversationId", "createdAt");
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");
CREATE INDEX "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog"("targetUserId");

ALTER TABLE "TestQuestionOption" ADD CONSTRAINT "TestQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "TestQuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResultRecommendation" ADD CONSTRAINT "ResultRecommendation_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "TestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResultRecommendation" ADD CONSTRAINT "ResultRecommendation_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedProfession" ADD CONSTRAINT "SavedProfession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedProfession" ADD CONSTRAINT "SavedProfession_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuideConversation" ADD CONSTRAINT "GuideConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuideMessage" ADD CONSTRAINT "GuideMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "GuideConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
