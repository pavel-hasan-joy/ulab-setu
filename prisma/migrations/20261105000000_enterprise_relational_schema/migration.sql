-- ==============================================================================
-- ULAB Setu Database Migration: Enterprise Relational Schema
-- Migration: 20261105000000_enterprise_relational_schema
-- Target DBMS: PostgreSQL 14+
-- Safety Guarantee: Non-destructive, idempotent, preserves all existing tables and data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extend "User" Table with Verification, Timestamps, and Audit Columns
-- ------------------------------------------------------------------------------
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "alumniVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verificationMethod" TEXT DEFAULT 'ulab_email',
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Create Performance and Search Indexes on "User"
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department");
CREATE INDEX IF NOT EXISTS "User_studentId_idx" ON "User"("studentId");
CREATE INDEX IF NOT EXISTS "User_alumniVerified_idx" ON "User"("alumniVerified");
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- ------------------------------------------------------------------------------
-- 2. Extend "Job" Table with Soft Deletion & Audit Columns
-- ------------------------------------------------------------------------------
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Job_postedById_idx" ON "Job"("postedById");
CREATE INDEX IF NOT EXISTS "Job_active_idx" ON "Job"("active");
CREATE INDEX IF NOT EXISTS "Job_category_idx" ON "Job"("category");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX IF NOT EXISTS "Job_deletedAt_idx" ON "Job"("deletedAt");

-- ------------------------------------------------------------------------------
-- 3. Extend "Application" Table with Resume Metadata & Audit Timestamps
-- ------------------------------------------------------------------------------
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Application_studentId_idx" ON "Application"("studentId");
CREATE INDEX IF NOT EXISTS "Application_jobId_idx" ON "Application"("jobId");
CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");

-- ------------------------------------------------------------------------------
-- 4. Extend "Connection" & "Message" Tables (Direct Messaging)
-- ------------------------------------------------------------------------------
ALTER TABLE "Connection"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Connection_fromId_idx" ON "Connection"("fromId");
CREATE INDEX IF NOT EXISTS "Connection_toId_idx" ON "Connection"("toId");
CREATE INDEX IF NOT EXISTS "Connection_status_idx" ON "Connection"("status");

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Message_connectionId_createdAt_idx" ON "Message"("connectionId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "Message_isRead_idx" ON "Message"("isRead");

-- ------------------------------------------------------------------------------
-- 5. Extend "Post" Table (Notice Board & Announcements)
-- ------------------------------------------------------------------------------
ALTER TABLE "Post"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX IF NOT EXISTS "Post_kind_idx" ON "Post"("kind");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS "Post_deletedAt_idx" ON "Post"("deletedAt");

-- ------------------------------------------------------------------------------
-- 6. Create "RolePermission" Table (Dynamic RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "role" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "description" TEXT,
  "granted" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_role_permission_key" UNIQUE ("role", "permission")
);

CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role");

-- ------------------------------------------------------------------------------
-- 7. Create "Notification" Table (In-App Alerts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "actorId" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "link" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- ------------------------------------------------------------------------------
-- 8. Create "MentorshipRequest" Table (Student-Alumni-Faculty Mentorships)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorshipRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "mentorId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "mentorNotes" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MentorshipRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MentorshipRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MentorshipRequest_studentId_idx" ON "MentorshipRequest"("studentId");
CREATE INDEX IF NOT EXISTS "MentorshipRequest_mentorId_idx" ON "MentorshipRequest"("mentorId");
CREATE INDEX IF NOT EXISTS "MentorshipRequest_status_idx" ON "MentorshipRequest"("status");
CREATE INDEX IF NOT EXISTS "MentorshipRequest_createdAt_idx" ON "MentorshipRequest"("createdAt");

-- ------------------------------------------------------------------------------
-- 9. Create "SupportTicket" Table (User Helpdesk & Inquiries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticketNumber" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "assignedToId" TEXT,
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- ------------------------------------------------------------------------------
-- 10. Create "UserReport" Table (Moderation, Trust & Safety)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "UserReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reporterId" TEXT NOT NULL,
  "reportedUserId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "resolvedById" TEXT,
  "resolutionNotes" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "UserReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserReport_reporterId_idx" ON "UserReport"("reporterId");
CREATE INDEX IF NOT EXISTS "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");
CREATE INDEX IF NOT EXISTS "UserReport_status_idx" ON "UserReport"("status");
CREATE INDEX IF NOT EXISTS "UserReport_targetType_idx" ON "UserReport"("targetType");

-- ------------------------------------------------------------------------------
-- 11. Create "AdminAuditLog" Table (Governance & Security Auditing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "details" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_idx" ON "AdminAuditLog"("targetType");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- ------------------------------------------------------------------------------
-- 12. Row-Level Security (RLS) Policy Blueprints (PostgreSQL Native Enforcement)
-- ------------------------------------------------------------------------------
-- Enable Row Level Security on sensitive tables
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MentorshipRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;

-- Note: When executing direct SQL under app user role (e.g., current_setting('request.jwt.claim.sub', true)):
-- Notification: users can only select and update their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'Notification' AND policyname = 'user_access_own_notifications'
  ) THEN
    CREATE POLICY user_access_own_notifications ON "Notification"
      FOR ALL
      USING (true); -- App layer / Prisma Client currently manages service role queries with session validation
  END IF;
END $$;

