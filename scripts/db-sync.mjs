import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        val = val.replace(/^['"](.*)['"]$/, "$1").trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const isPostgres =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith("postgres://") ||
    process.env.DATABASE_URL.startsWith("postgresql://") ||
    process.env.DATABASE_URL.includes("postgres"));

if (isPostgres) {
  try {
    console.log("DATABASE_URL found, synchronizing database schema via prisma db push (--accept-data-loss)...");
    execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit" });
    console.log("Database schema synchronized successfully.");

    // Clean up expired jobs and extra demo jobs from live database
    const db = new PrismaClient();
    try {
      // 1. Delete jobs with expired deadline
      const expired = await db.job.deleteMany({
        where: {
          deadline: {
            not: null,
            lt: new Date(),
          },
        },
      });
      if (expired.count > 0) {
        console.log(`Cleaned up ${expired.count} expired deadline jobs.`);
      }

      // 2. Remove extra demo jobs, keeping only the 2 main demo jobs
      const extraDemoTitles = [
        "Management Trainee, Marketing",
        "Graduate Engineer, Substations",
        "Editorial Intern",
        "Field Research Assistant",
        "Part-time Teaching Assistant",
        "Research Assistant, ML Lab",
      ];
      const deletedDemo = await db.job.deleteMany({
        where: {
          title: { in: extraDemoTitles },
        },
      });
      if (deletedDemo.count > 0) {
        console.log(`Removed ${deletedDemo.count} extra demo jobs.`);
      }

      // 3. Dynamic bcrypt password hashes (configurable via environment variables)
      const userDefaultPass = process.env.DEMO_USER_PASSWORD || "password123";
      const adminDefaultPass = process.env.DEMO_ADMIN_PASSWORD || "Admin@ulab2026";
      const passwordHash = bcrypt.hashSync(userDefaultPass, 10);
      const adminPasswordHash = bcrypt.hashSync(adminDefaultPass, 10);

      // Clean up any test personal accounts so Pavel can test registration/login from scratch
      await db.user.deleteMany({
        where: {
          email: {
            in: [
              "pavel.admin@ulab.edu.bd",
              "pavel.hasan.cse@ulab.edu.bd",
              "pavel.hasan.joy@ulab.edu.bd",
            ],
          },
        },
      });

      // 1 Single Institutional Super Admin
      await db.user.upsert({
        where: { email: "admin@ulab.edu.bd" },
        update: {
          status: "APPROVED",
          role: "ADMIN",
          passwordHash: adminPasswordHash,
          emailVerified: true,
          alumniVerified: false,
          verificationMethod: "institutional_admin",
        },
        create: {
          name: "ULAB Admin Office",
          email: "admin@ulab.edu.bd",
          passwordHash: adminPasswordHash,
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: true,
          alumniVerified: false,
          verificationMethod: "institutional_admin",
          department: "Alumni Affairs & Career Services",
          designation: "Head of Administration",
          bio: "Official administrator account for ULAB Setu platform management.",
        },
      });

      // Demo Student
      const sampleStudent = await db.user.upsert({
        where: { email: "student@ulab.edu.bd" },
        update: {
          status: "APPROVED",
          role: "STUDENT",
          passwordHash,
          emailVerified: true,
          alumniVerified: false,
          verificationMethod: "ulab_email",
        },
        create: {
          name: "Farhana Akter",
          email: "student@ulab.edu.bd",
          passwordHash,
          role: "STUDENT",
          status: "APPROVED",
          emailVerified: true,
          alumniVerified: false,
          verificationMethod: "ulab_email",
          verifiedAt: new Date(),
          department: "Computer Science and Engineering",
          studentId: "221014012",
          batch: "2022",
          bio: "Final year CSE student at ULAB interested in web development and cloud technologies.",
          skills: "JavaScript, React, TypeScript, Python",
        },
      });

      // Demo Teacher
      const sampleTeacher = await db.user.upsert({
        where: { email: "teacher@ulab.edu.bd" },
        update: {
          status: "APPROVED",
          role: "TEACHER",
          passwordHash,
          emailVerified: true,
          alumniVerified: false,
          verificationMethod: "ulab_email",
        },
        create: {
          name: "Dr. Kamrul Karim",
          email: "teacher@ulab.edu.bd",
          passwordHash,
          role: "TEACHER",
          status: "APPROVED",
          emailVerified: true,
          alumniVerified: false,
          verificationMethod: "ulab_email",
          verifiedAt: new Date(),
          department: "Computer Science and Engineering",
          designation: "Associate Professor",
          bio: "Teaches Software Engineering and Database Systems. Passionate about student mentorship.",
          skills: "Database Systems, Software Engineering, Cloud Architecture",
        },
      });

      // Demo Alumni
      const sampleAlumni = await db.user.upsert({
        where: { email: "alumni@ulab.edu.bd" },
        update: {
          status: "APPROVED",
          role: "ALUMNI",
          passwordHash,
          emailVerified: true,
          alumniVerified: true,
          verificationMethod: "ulab_email",
          city: "Dhaka",
          country: "Bangladesh",
          countryCode: "BD",
          latitude: 23.8103,
          longitude: 90.4125,
          mapLocationVisibility: "PUBLIC",
        },
        create: {
          name: "Tanvir Hasan",
          email: "alumni@ulab.edu.bd",
          passwordHash,
          role: "ALUMNI",
          status: "APPROVED",
          emailVerified: true,
          alumniVerified: true,
          verificationMethod: "ulab_email",
          verifiedAt: new Date(),
          department: "Computer Science and Engineering",
          graduationYear: "2018",
          studentId: "141014001",
          company: "Nimbus Labs",
          designation: "Senior Software Engineer",
          location: "Dhaka, Bangladesh",
          bio: "ULAB CSE 2018 graduate, now Senior Software Engineer at Nimbus Labs. Happy to talk about career growth.",
          skills: "React, Node.js, Go, System Design",
          city: "Dhaka",
          country: "Bangladesh",
          countryCode: "BD",
          latitude: 23.8103,
          longitude: 90.4125,
          mapLocationVisibility: "PUBLIC",
          phone: "01700000001",
          phonePublic: true,
          whatsapp: "01700000001",
          whatsappPublic: true,
        },
      });

      // Seed global verified alumni around the world for the Global Alumni Map
      const globalAlumniSeed = [
        {
          name: "Nusrat Jahan",
          email: "alumni2@ulab.edu.bd",
          department: "Business Administration",
          graduationYear: "2017",
          studentId: "131011002",
          company: "Meghna Consumer Goods",
          designation: "Brand Manager",
          city: "London",
          country: "United Kingdom",
          countryCode: "GB",
          latitude: 51.5074,
          longitude: -0.1278,
          mapLocationVisibility: "PUBLIC",
          skills: "Brand strategy, Market research",
        },
        {
          name: "Arif Rahman",
          email: "alumni3@ulab.edu.bd",
          department: "Electrical & Electronic Engineering",
          graduationYear: "2016",
          studentId: "121012003",
          company: "Padma Grid Solutions",
          designation: "Project Engineer",
          city: "Toronto",
          country: "Canada",
          countryCode: "CA",
          latitude: 43.6532,
          longitude: -79.3832,
          mapLocationVisibility: "PUBLIC",
          skills: "Power systems, AutoCAD",
        },
        {
          name: "Sadia Islam",
          email: "alumni4@ulab.edu.bd",
          department: "Media Studies and Journalism",
          graduationYear: "2019",
          studentId: "151013004",
          company: "Daily Horizon",
          designation: "Sub-editor",
          city: "New York",
          country: "United States",
          countryCode: "US",
          latitude: 40.7128,
          longitude: -74.0060,
          mapLocationVisibility: "PUBLIC",
          skills: "Editing, Digital journalism",
        },
        {
          name: "Rafiq Chowdhury",
          email: "alumni5@ulab.edu.bd",
          department: "Environmental Science and Sustainability",
          graduationYear: "2015",
          studentId: "111015005",
          company: "GreenDelta Foundation",
          designation: "Program Officer",
          city: "Sydney",
          country: "Australia",
          countryCode: "AU",
          latitude: -33.8688,
          longitude: 151.2093,
          mapLocationVisibility: "MEMBERS_ONLY",
          skills: "Climate policy, GIS",
        },
        {
          name: "Mehnaz Karim",
          email: "alumni6@ulab.edu.bd",
          department: "English and Humanities",
          graduationYear: "2020",
          studentId: "161016006",
          company: "Brightpath Education",
          designation: "Curriculum Lead",
          city: "Berlin",
          country: "Germany",
          countryCode: "DE",
          latitude: 52.5200,
          longitude: 13.4050,
          mapLocationVisibility: "PUBLIC",
          skills: "Curriculum design, Training",
        },
      ];

      for (const a of globalAlumniSeed) {
        await db.user.upsert({
          where: { email: a.email },
          update: {
            status: "APPROVED",
            role: "ALUMNI",
            alumniVerified: true,
            city: a.city,
            country: a.country,
            countryCode: a.countryCode,
            latitude: a.latitude,
            longitude: a.longitude,
            mapLocationVisibility: a.mapLocationVisibility,
            company: a.company,
            designation: a.designation,
          },
          create: {
            name: a.name,
            email: a.email,
            passwordHash,
            role: "ALUMNI",
            status: "APPROVED",
            emailVerified: true,
            alumniVerified: true,
            verificationMethod: "ulab_email",
            verifiedAt: new Date(),
            department: a.department,
            graduationYear: a.graduationYear,
            studentId: a.studentId,
            company: a.company,
            designation: a.designation,
            location: `${a.city}, ${a.country}`,
            bio: `ULAB ${a.department} graduate, now ${a.designation} at ${a.company}. Happy to connect with students and alumni worldwide.`,
            skills: a.skills,
            city: a.city,
            country: a.country,
            countryCode: a.countryCode,
            latitude: a.latitude,
            longitude: a.longitude,
            mapLocationVisibility: a.mapLocationVisibility,
          },
        });
      }

      console.log("Sample accounts (student, teacher, alumni) synced successfully.");

      // Seed Default Role Permissions
      const defaultPermissions = [
        { role: "STUDENT", permission: "jobs:view", description: "Browse open jobs and internships" },
        { role: "STUDENT", permission: "jobs:apply", description: "Submit job and internship applications" },
        { role: "STUDENT", permission: "mentorship:request", description: "Request mentorship from alumni/teachers" },
        { role: "STUDENT", permission: "messages:send", description: "Send direct messages to connections" },
        { role: "STUDENT", permission: "tickets:create", description: "Open helpdesk support tickets" },
        { role: "STUDENT", permission: "reports:create", description: "Report inappropriate content or users" },
        { role: "ALUMNI", permission: "jobs:view", description: "Browse all job listings" },
        { role: "ALUMNI", permission: "jobs:create", description: "Post job and referral opportunities" },
        { role: "ALUMNI", permission: "posts:create", description: "Publish notices, events, and scholarships" },
        { role: "ALUMNI", permission: "mentorship:provide", description: "Accept mentorship and review student requests" },
        { role: "TEACHER", permission: "jobs:create", description: "Post research assistantships and jobs" },
        { role: "TEACHER", permission: "posts:create", description: "Publish academic notices and events" },
        { role: "TEACHER", permission: "mentorship:provide", description: "Guide students through academic mentorship" },
        { role: "ADMIN", permission: "admin:access", description: "Full access to administrative dashboard" },
        { role: "ADMIN", permission: "users:manage", description: "Manage user accounts, roles and status" },
        { role: "ADMIN", permission: "reports:resolve", description: "Investigate and resolve trust & safety reports" },
        { role: "ADMIN", permission: "tickets:manage", description: "Assign, respond, and close support tickets" },
        { role: "ADMIN", permission: "audit:view", description: "View security audit and login logs" },
        { role: "ADMIN", permission: "cms:view", description: "Access Content Management System overview and editor" },
        { role: "ADMIN", permission: "cms:permissions:manage", description: "Manage CMS editorial roles, reviewers, and publishers" },
      ];

      for (const perm of defaultPermissions) {
        await db.rolePermission.upsert({
          where: { role_permission: { role: perm.role, permission: perm.permission } },
          update: { description: perm.description },
          create: perm,
        });
      }
      console.log("Default role permissions initialized.");

      // 4. Upsert a Sample Messenger Group for instant testing
      const sampleGroup = await db.group.upsert({
        where: { id: "sample-ulab-cse-hub" },
        update: {},
        create: {
          id: "sample-ulab-cse-hub",
          name: "ULAB CSE Tech & Project Hub",
          description: "General discussion, tech announcements, academic queries, and project collaboration for ULAB CSE students, faculty, and alumni.",
          createdById: sampleTeacher.id,
        },
      });

      // Ensure teacher, student, and alumni are members of this group
      await db.groupMember.upsert({
        where: { groupId_userId: { groupId: sampleGroup.id, userId: sampleTeacher.id } },
        update: {},
        create: {
          groupId: sampleGroup.id,
          userId: sampleTeacher.id,
          role: "ADMIN",
        },
      });

      await db.groupMember.upsert({
        where: { groupId_userId: { groupId: sampleGroup.id, userId: sampleStudent.id } },
        update: {},
        create: {
          groupId: sampleGroup.id,
          userId: sampleStudent.id,
          role: "MEMBER",
        },
      });

      await db.groupMember.upsert({
        where: { groupId_userId: { groupId: sampleGroup.id, userId: sampleAlumni.id } },
        update: {},
        create: {
          groupId: sampleGroup.id,
          userId: sampleAlumni.id,
          role: "MEMBER",
        },
      });

      // Sample Group Messages
      const existingMsgCount = await db.groupMessage.count({
        where: { groupId: sampleGroup.id },
      });
      if (existingMsgCount === 0) {
        await db.groupMessage.createMany({
          data: [
            {
              groupId: sampleGroup.id,
              senderId: sampleTeacher.id,
              body: "Assalamu alaikum everyone! Welcome to the ULAB CSE Tech Hub. Anyone can share ideas, ask questions, or initiate tech discussions here.",
            },
            {
              groupId: sampleGroup.id,
              senderId: sampleStudent.id,
              body: "Walaikum assalam Sir! Great to have faculty and seniors together here in this group.",
            },
            {
              groupId: sampleGroup.id,
              senderId: sampleAlumni.id,
              body: "Hello everyone! Happy to connect and help out with industry insights and mock interview preps.",
            },
          ],
        });
      }

      // Sample Tuitions (if none exist)
      const existingTuitionCount = await db.tuition.count();
      if (existingTuitionCount === 0) {
        await db.tuition.createMany({
          data: [
            {
              title: "Need HSC 2026 Higher Math & Physics Home Tutor",
              classGrade: "Class 11-12 (HSC)",
              curriculum: "English Version",
              subjects: "Higher Math, Physics",
              tutoringType: "Home Tutoring",
              location: "Dhanmondi (Near ULAB Campus), Dhaka",
              daysPerWeek: "3 Days / Week",
              salary: "8,000 BDT/Month",
              studentGender: "Male",
              preferredTutorGender: "Male Preferred",
              requirements: "Must be strong in Higher Mathematics and calculus. CSE or EEE background preferred.",
              status: "OPEN",
              postedById: sampleTeacher.id,
            },
            {
              title: "Need Class 8 All Subjects (Math & Science Focus) Home Tutor",
              classGrade: "Class 6-8",
              curriculum: "Bangla Medium",
              subjects: "General Math, General Science, English",
              tutoringType: "Home Tutoring",
              location: "Mohammadpur, Dhaka",
              daysPerWeek: "4 Days / Week",
              salary: "6,000 BDT/Month",
              studentGender: "Female",
              preferredTutorGender: "Female Preferred",
              requirements: "Patience with middle school mathematics and homework guidance. Punctual tutor needed.",
              status: "OPEN",
              postedById: sampleStudent.id,
            },
            {
              title: "Need O-Level Pure Math & Physics Online Tutor",
              classGrade: "O-Level",
              curriculum: "English Medium",
              subjects: "Pure Mathematics, Physics",
              tutoringType: "Online Tutoring",
              location: "Online (Google Meet / Zoom)",
              daysPerWeek: "3 Days / Week",
              salary: "10,000 BDT/Month",
              studentGender: "Male",
              preferredTutorGender: "Any",
              requirements: "Familiar with Cambridge / Edexcel past papers and exam solving techniques.",
              status: "OPEN",
              postedById: sampleAlumni.id,
            },
          ],
        });
        console.log("Seeded sample tuitions successfully.");
      }

      // Sample Notifications
      const existingNotifCount = await db.notification.count();
      if (existingNotifCount === 0) {
        await db.notification.createMany({
          data: [
            {
              userId: sampleStudent.id,
              actorId: sampleAlumni.id,
              title: "Connection Accepted",
              body: "Tanvir Hasan accepted your connection request.",
              type: "CONNECTION",
              link: "/student/messages",
              read: true,
            },
            {
              userId: sampleStudent.id,
              actorId: sampleTeacher.id,
              title: "New Research Opportunity",
              body: "Dr. Kamrul Karim posted a new research assistant position.",
              type: "SYSTEM",
              link: "/student/notices",
              read: false,
            },
          ],
        });
      }

      // Sample Mentorship Request
      const existingMentorReqCount = await db.mentorshipRequest.count();
      if (existingMentorReqCount === 0) {
        await db.mentorshipRequest.create({
          data: {
            studentId: sampleStudent.id,
            mentorId: sampleAlumni.id,
            topic: "Resume Review & Frontend Roadmap",
            message: "Hello Tanvir bhaiya, I would love some feedback on my portfolio and advice on applying for junior React roles.",
            status: "ACCEPTED",
            mentorNotes: "Scheduled a 30-min call next Saturday at 4 PM.",
          },
        });
      }

      // Sample Support Ticket
      const existingTicketCount = await db.supportTicket.count();
      if (existingTicketCount === 0) {
        const adminUser = await db.user.findUnique({ where: { email: "admin@ulab.edu.bd" } });
        await db.supportTicket.create({
          data: {
            ticketNumber: "TICK-1001",
            userId: sampleStudent.id,
            subject: "Update Student ID on Record",
            description: "I need to ensure my student ID reflects my latest semester registration card.",
            category: "ACCOUNT",
            priority: "LOW",
            status: "RESOLVED",
            assignedToId: adminUser?.id,
            resolution: "Verified against institutional registry and updated profile.",
            resolvedAt: new Date(),
          },
        });
      }

      // Sample Admin Audit Log
      const existingAuditCount = await db.adminAuditLog.count();
      if (existingAuditCount === 0) {
        const adminUser = await db.user.findUnique({ where: { email: "admin@ulab.edu.bd" } });
        if (adminUser) {
          await db.adminAuditLog.create({
            data: {
              adminId: adminUser.id,
              action: "SYSTEM_INITIALIZATION",
              targetType: "DATABASE",
              targetId: "ulab_setu_prod",
              details: "Enterprise schema initialized with RBAC, Mentorship, Support & Audit tables.",
            },
          });
        }
      }

      // 500 Synthetic Demo Alumni for Global Alumni Map Showcase
      const existingDemoCount = await db.user.count({ where: { isDemo: true } });
      if (existingDemoCount < 500) {
        console.log(`Seeding 500 Synthetic Demo Alumni profiles (current: ${existingDemoCount})...`);
        const { SYNTHETIC_DEMO_ALUMNI } = await import("../src/lib/demo-alumni-dataset.ts");
        const dummyPassHash = bcrypt.hashSync("DemoAlumniSecret@2026-Synthetic", 10);

        await db.user.deleteMany({ where: { isDemo: true } });
        const records = SYNTHETIC_DEMO_ALUMNI.map((item) => ({
          ...item,
          passwordHash: dummyPassHash,
        }));
        await db.user.createMany({
          data: records,
          skipDuplicates: true,
        });
        console.log("500 Synthetic Demo Alumni profiles seeded successfully across 55 countries.");
      }
    } catch (cleanupErr) {
      console.warn("Live DB sync warning:", cleanupErr?.message || cleanupErr);
    } finally {
      await db.$disconnect();
    }
  } catch (err) {
    console.warn("prisma db push warning:", err?.message || err);
  }
} else {
  console.log("No DATABASE_URL set, skipping database push.");
}
