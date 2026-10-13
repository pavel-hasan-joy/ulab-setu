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

      // 4. Upsert a Sample Classroom for instant testing
      const sampleClassroom = await db.classroom.upsert({
        where: { code: "ULAB31" },
        update: {},
        create: {
          name: "CSE 311: Database Management Systems",
          section: "Section 1 • Spring 2026",
          subject: "CSE",
          description: "Welcome to CSE 311! Here we share course announcements, assignments, and real-time class discussions.",
          code: "ULAB31",
          createdById: sampleTeacher.id,
        },
      });

      // Ensure teacher and student are enrolled in this classroom
      await db.classroomMember.upsert({
        where: { classroomId_userId: { classroomId: sampleClassroom.id, userId: sampleTeacher.id } },
        update: {},
        create: {
          classroomId: sampleClassroom.id,
          userId: sampleTeacher.id,
          role: "TEACHER",
        },
      });

      await db.classroomMember.upsert({
        where: { classroomId_userId: { classroomId: sampleClassroom.id, userId: sampleStudent.id } },
        update: {},
        create: {
          classroomId: sampleClassroom.id,
          userId: sampleStudent.id,
          role: "STUDENT",
        },
      });

      // Sample Pinned Notice
      const existingNotice = await db.classroomNotice.findFirst({
        where: { classroomId: sampleClassroom.id },
      });
      if (!existingNotice) {
        await db.classroomNotice.create({
          data: {
            classroomId: sampleClassroom.id,
            authorId: sampleTeacher.id,
            title: "Welcome to CSE 311 & Midterm Syllabus",
            content: "Welcome everyone! Midterm exam will cover ER Diagrams, Relational Algebra, and SQL queries (joins, aggregations, subqueries). Please check the notice board regularly.",
            isPinned: true,
          },
        });
      }

      // Sample WhatsApp-style Messages
      const existingMsgCount = await db.classroomMessage.count({
        where: { classroomId: sampleClassroom.id },
      });
      if (existingMsgCount === 0) {
        await db.classroomMessage.createMany({
          data: [
            {
              classroomId: sampleClassroom.id,
              senderId: sampleTeacher.id,
              body: "Assalamu alaikum everyone! Welcome to the CSE 311 Classroom group chat. You can ask questions and discuss course topics here anytime.",
            },
            {
              classroomId: sampleClassroom.id,
              senderId: sampleStudent.id,
              body: "Walaikum assalam Sir! Thank you. Could you please share when the project topic selection deadline is?",
            },
            {
              classroomId: sampleClassroom.id,
              senderId: sampleTeacher.id,
              body: "The project topic submission deadline is next Sunday. I have pinned the syllabus details in the Notices tab above.",
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
