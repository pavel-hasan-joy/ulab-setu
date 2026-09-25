// Demo data for local testing. All people and companies here are fictional.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const days = (n: number) => new Date(Date.now() + n * 864e5);

async function main() {
  await db.post.deleteMany();
  await db.message.deleteMany();
  await db.connection.deleteMany();
  await db.application.deleteMany();
  await db.job.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  await db.user.create({
    data: { name: "Alumni Office", email: "admin@ulab.edu.bd", passwordHash, role: "ADMIN" },
  });

  const alumni = await Promise.all(
    [
      ["Tanvir Hasan", "Computer Science and Engineering", "2018", "Nimbus Labs", "Senior Software Engineer", "Dhaka", "React, Node.js, System design"],
      ["Nusrat Jahan", "Business Administration", "2017", "Meghna Consumer Goods", "Brand Manager", "Dhaka", "Brand strategy, Market research"],
      ["Arif Rahman", "Electrical & Electronic Engineering", "2016", "Padma Grid Solutions", "Project Engineer", "Chattogram", "Power systems, AutoCAD"],
      ["Sadia Islam", "Media Studies and Journalism", "2019", "Daily Horizon", "Sub-editor", "Dhaka", "Editing, Digital journalism"],
      ["Rafiq Chowdhury", "Environmental Science and Sustainability", "2015", "GreenDelta Foundation", "Program Officer", "Sylhet", "Climate policy, GIS"],
      ["Mehnaz Karim", "English and Humanities", "2020", "Brightpath Education", "Curriculum Lead", "Dhaka", "Curriculum design, Training"],
    ].map(([name, department, graduationYear, company, designation, location, skills], i) =>
      db.user.create({
        data: {
          name, department, graduationYear, company, designation, location, skills,
          email: `alumni${i + 1}@example.com`, passwordHash, role: "ALUMNI", status: "APPROVED",
          studentId: `${graduationYear.slice(2)}1${i}0${i}01`,
          bio: `ULAB ${department} graduate, now ${designation.toLowerCase()} at ${company}. Happy to talk about getting your first job.`,
        },
      }),
    ),
  );

  await db.user.create({
    data: {
      name: "Imran Hossain", email: "pending.alumni@example.com", passwordHash, role: "ALUMNI", status: "PENDING",
      department: "Computer Science and Engineering", graduationYear: "2021", studentId: "171014045",
      company: "Kite Payments", designation: "Backend Engineer", location: "Dhaka",
    },
  });

  const student = await db.user.create({
    data: {
      name: "Farhana Akter", email: "student@ulab.edu.bd", passwordHash, role: "STUDENT",
      department: "Computer Science and Engineering", batch: "2022", studentId: "221014012",
      bio: "Final year CSE student interested in web development.", skills: "JavaScript, React, Python",
    },
  });
  await db.user.create({
    data: {
      name: "Sabbir Ahmed", email: "student2@ulab.edu.bd", passwordHash, role: "STUDENT",
      department: "Business Administration", batch: "2023", studentId: "231021033",
    },
  });

  const [tanvir, nusrat, arif, sadia, rafiq, mehnaz] = alumni;
  // Tanvir shares his phone publicly but keeps Facebook private (used by the tests).
  await db.user.update({
    where: { id: tanvir.id },
    data: { phone: "01700000001", phonePublic: true, whatsapp: "01700000001", whatsappPublic: true, facebook: "https://facebook.com/tanvir.demo", facebookPublic: false },
  });
  const jobs = await Promise.all([
    db.job.create({ data: { postedById: tanvir.id, title: "Frontend Engineer Intern", company: "Nimbus Labs", location: "Dhaka (Hybrid)", type: "Internship", category: "Software & IT", referral: true, salary: "BDT 20,000 / month", deadline: days(14),
      description: "Work with our product team on a React and TypeScript dashboard used by logistics companies. You'll ship real features in your first month, pair with senior engineers and get code reviews every day.",
      requirements: "Comfortable with JavaScript and React basics\nHas built at least one project you can show\nFinal year or recent graduate" } }),
    db.job.create({ data: { postedById: tanvir.id, title: "Junior Backend Developer", company: "Nimbus Labs", location: "Dhaka", type: "Full-time", category: "Software & IT", referral: true, salary: "BDT 45,000 – 60,000", deadline: days(21),
      description: "Build and maintain Node.js services and PostgreSQL databases for our routing platform. We're looking for someone curious who likes understanding how things work under the hood.",
      requirements: "Node.js or Python\nSQL fundamentals\n0–2 years of experience" } }),
    db.job.create({ data: { postedById: nusrat.id, title: "Management Trainee, Marketing", company: "Meghna Consumer Goods", location: "Dhaka", type: "Full-time", category: "Marketing & Communication", referral: true, deadline: days(10),
      description: "A 12-month rotational program across brand, trade marketing and consumer insights. I went through this program myself and I'm happy to answer questions from ULAB students.",
      requirements: "BBA or related degree\nStrong communication in English and Bangla\nCGPA 3.25 or above" } }),
    db.job.create({ data: { postedById: arif.id, title: "Graduate Engineer, Substations", company: "Padma Grid Solutions", location: "Chattogram", type: "Full-time", category: "Engineering", deadline: days(18),
      description: "Join the substation design team working on 33/11 kV projects. You'll support site surveys, prepare single-line diagrams and learn protection coordination.",
      requirements: "BSc in EEE\nAutoCAD\nWilling to travel to project sites" } }),
    db.job.create({ data: { postedById: sadia.id, title: "Editorial Intern", company: "Daily Horizon", location: "Dhaka", type: "Internship", category: "Media & Journalism", salary: "BDT 12,000 / month", deadline: days(7),
      description: "Help the digital desk write, edit and fact-check stories. Great fit for MSJ students who want newsroom experience before graduating.",
      requirements: "Excellent written English\nBasic social media skills" } }),
    db.job.create({ data: { postedById: rafiq.id, title: "Field Research Assistant", company: "GreenDelta Foundation", location: "Sylhet", type: "Contract", category: "Development Sector / NGO", salary: "BDT 30,000 / month", deadline: days(25),
      description: "Six-month contract collecting and analysing data on haor-area climate adaptation projects. Includes training in survey tools and GIS.",
      requirements: "Environmental Science or related\nComfortable with field travel\nExcel or SPSS" } }),
    db.job.create({ data: { postedById: mehnaz.id, title: "Part-time Teaching Assistant", company: "Brightpath Education", location: "Dhaka (Dhanmondi)", type: "Part-time", category: "Research & Education", referral: true, salary: "BDT 15,000 / month", deadline: days(12),
      description: "Support IELTS and spoken English classes three evenings a week. Flexible around your university schedule.",
      requirements: "IELTS 7.0+ or equivalent\nPatient and friendly" } }),
  ]);

  const [drKarim, msAnika] = await Promise.all([
    db.user.create({
      data: {
        name: "Dr. Kamrul Karim", email: "teacher@ulab.edu.bd", passwordHash, role: "TEACHER", status: "APPROVED",
        department: "Computer Science and Engineering", designation: "Associate Professor", location: "Dhaka",
        bio: "Teaches software engineering and machine learning. Always looking for curious research assistants.", skills: "Machine learning, Software engineering",
      },
    }),
    db.user.create({
      data: {
        name: "Anika Rahman", email: "teacher2@ulab.edu.bd", passwordHash, role: "TEACHER", status: "APPROVED",
        department: "Media Studies and Journalism", designation: "Lecturer", location: "Dhaka",
        bio: "Teaches digital journalism and runs the campus newsroom lab.", skills: "Journalism, Documentary",
      },
    }),
  ]);
  await db.user.create({
    data: { name: "Pending Teacher", email: "pending.teacher@ulab.edu.bd", passwordHash, role: "TEACHER", status: "PENDING", department: "English and Humanities", designation: "Lecturer" },
  });

  await db.job.create({ data: { postedById: drKarim.id, title: "Research Assistant, ML Lab", company: "ULAB CSE Department", location: "ULAB campus", type: "Part-time", category: "Research & Education", salary: "BDT 10,000 / month", deadline: days(20),
    description: "Help with data collection and model experiments for a Bangla speech recognition project. 12 hours a week, flexible around classes.",
    requirements: "Python\nCompleted a machine learning course\nCGPA 3.3 or above" } });

  await db.post.createMany({
    data: [
      { authorId: drKarim.id, kind: "Research", title: "Looking for 2 research assistants for Bangla speech project", body: "Third and fourth year CSE students can apply. Apply through the jobs tab or message me directly.", eventDate: days(20) },
      { authorId: msAnika.id, kind: "Event", title: "Campus newsroom open day", body: "Visit the MSJ newsroom lab, see how we produce the weekly bulletin, and sign up for the reporting workshop.", eventDate: days(6) },
      { authorId: alumni[1].id, kind: "Scholarship", title: "Meghna Foundation merit scholarship 2027", body: "Full tuition support for BBA students with CGPA 3.5+. I'm happy to review applications before you submit.", link: "https://example.com/scholarship", eventDate: days(30) },
      { authorId: drKarim.id, kind: "Notice", title: "CSE 499 project proposal deadline moved", body: "Final year project proposals are now due next Thursday. Submit through the department portal." },
    ],
  });

  await db.application.create({ data: { jobId: jobs[0].id, studentId: student.id, note: "I built a React dashboard for my capstone project and would love to learn from your team." } });

  const conn = await db.connection.create({ data: { fromId: student.id, toId: tanvir.id, status: "ACCEPTED", note: "Hi bhaiya, I'm a CSE student interested in frontend roles." } });
  await db.message.createMany({
    data: [
      { connectionId: conn.id, senderId: student.id, body: "Assalamu alaikum bhaiya! Thanks for accepting. Could you share how you prepared for your first interview?" },
      { connectionId: conn.id, senderId: tanvir.id, body: "Walaikum assalam! Sure. Focus on JavaScript fundamentals and be ready to explain one project in depth. Send me your GitHub and I'll take a look." },
    ],
  });
  await db.connection.create({ data: { fromId: student.id, toId: nusrat.id, status: "PENDING", note: "Hello apu, I'd love to hear about the MT program." } });

  console.log("Seeded. Log in with password: password123");
}

main().finally(() => db.$disconnect());
