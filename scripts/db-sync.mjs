import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

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

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
  try {
    console.log("DATABASE_URL found, synchronizing database schema via prisma db push...");
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
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

      // 3. Upsert Sample Student, Teacher, Alumni accounts for user testing
      const passwordHash = "$2a$10$3zR6zIoxK5W0O.8YqQJk9ezl0uKqN3M/F9bNn4p7K.2Gg8Uu.QW6a"; // hash for "password123"

      const sampleStudent = await db.user.upsert({
        where: { email: "student@ulab.edu.bd" },
        update: { status: "APPROVED", role: "STUDENT" },
        create: {
          name: "Farhana Akter",
          email: "student@ulab.edu.bd",
          passwordHash,
          role: "STUDENT",
          status: "APPROVED",
          department: "Computer Science and Engineering",
          studentId: "221014012",
          batch: "2022",
          bio: "Final year CSE student at ULAB interested in web development and cloud technologies.",
          skills: "JavaScript, React, TypeScript, Python",
        },
      });

      const sampleTeacher = await db.user.upsert({
        where: { email: "teacher@ulab.edu.bd" },
        update: { status: "APPROVED", role: "TEACHER" },
        create: {
          name: "Dr. Kamrul Karim",
          email: "teacher@ulab.edu.bd",
          passwordHash,
          role: "TEACHER",
          status: "APPROVED",
          department: "Computer Science and Engineering",
          designation: "Associate Professor",
          bio: "Teaches Software Engineering and Database Systems. Passionate about student mentorship.",
          skills: "Database Systems, Software Engineering, Cloud Architecture",
        },
      });

      const sampleAlumni = await db.user.upsert({
        where: { email: "alumni@ulab.edu.bd" },
        update: { status: "APPROVED", role: "ALUMNI" },
        create: {
          name: "Tanvir Hasan",
          email: "alumni@ulab.edu.bd",
          passwordHash,
          role: "ALUMNI",
          status: "APPROVED",
          department: "Computer Science and Engineering",
          graduationYear: "2018",
          studentId: "141014001",
          company: "Nimbus Labs",
          designation: "Senior Software Engineer",
          location: "Dhaka",
          bio: "ULAB CSE 2018 graduate, now Senior Software Engineer at Nimbus Labs. Happy to talk about career growth.",
          skills: "React, Node.js, Go, System Design",
          phone: "01700000001",
          phonePublic: true,
          whatsapp: "01700000001",
          whatsappPublic: true,
        },
      });

      console.log("Sample accounts (student, teacher, alumni) synced successfully.");

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
