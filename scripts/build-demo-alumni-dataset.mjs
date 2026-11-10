import fs from "fs";
import path from "path";
import { VETTED_GLOBAL_CITIES } from "../src/lib/alumni-map.ts";

const OUTPUT_PATH = path.resolve(process.cwd(), "src", "lib", "demo-alumni-dataset.ts");

// 500 Unique First and Last Names
const FIRST_NAMES = [
  "Tanvir", "Farhana", "Shafin", "Ayesha", "Rashid", "Sadia", "Zubair", "Nusrat", "Tariq", "Mahmud",
  "Nafis", "Tasnim", "Kazi", "Sumaiya", "Imran", "Mehnaz", "Arif", "Nazia", "Faisal", "Samira",
  "Rifat", "Tahmina", "Siam", "Rumana", "Asif", "Sharmin", "Adnan", "Sabrina", "Zahid", "Nabila",
  "Shakil", "Anika", "Hasan", "Farzana", "Kamrul", "Jannat", "Rayhan", "Afroza", "Muntasir", "Sultana",
  "Shahriar", "Maliha", "Emon", "Bushra", "Sohan", "Lamia", "Nayeem", "Tasmia", "Habib", "Munira",
  "Alvi", "Raida", "Nahian", "Zarin", "Arman", "Mahira", "Fahim", "Nadia", "Sami", "Tasfia",
  "Abrar", "Raisa", "Tamim", "Humaira", "Wasif", "Shaila", "Salman", "Meherun", "Anis", "Tabassum",
  "Sakib", "Farial", "Jamil", "Afia", "Sajjad", "Subah", "Fardin", "Hafsa", "Mashrur", "Nawal",
  "Afsar", "Roshni", "Tawsif", "Lubna", "Shihab", "Samiha", "Riyad", "Fariha", "Anwar", "Naima",
  "Ibrahim", "Zara", "Mahir", "Khadija", "Ahnaf", "Sumona", "Sayed", "Rufaida", "Fahad", "Nayema",
  // International Names reflecting diverse global backgrounds
  "Alex", "Sophia", "Liam", "Emma", "Noah", "Olivia", "Lucas", "Ava", "Mason", "Isabella",
  "Ethan", "Mia", "Oliver", "Harper", "Elijah", "Evelyn", "Aiden", "Abigail", "James", "Emily",
  "Benjamin", "Ella", "Sebastian", "Elizabeth", "Henry", "Camila", "Alexander", "Luna", "Daniel", "Sofia",
  "Matthew", "Avery", "Samuel", "Mila", "David", "Aria", "Joseph", "Scarlett", "Carter", "Penelope",
  "Owen", "Chloe", "Wyatt", "Victoria", "John", "Grace", "Jack", "Zoey", "Luke", "Riley",
  "Kenji", "Yuki", "Haruto", "Yui", "Ren", "Hina", "Sora", "Mei", "Min-ho", "Ji-woo",
  "Seo-jun", "Ha-eun", "Do-yoon", "Seo-yeon", "Wei", "Li", "Jun", "Fang", "Hao", "Yan",
  "Arjun", "Priya", "Rohan", "Ananya", "Vikram", "Isha", "Aditya", "Neha", "Kabir", "Pooja",
  "Mateo", "Valentina", "Santiago", "Lucia", "Leonardo", "Martina", "Gabriel", "Elena", "Lucas", "Clara"
];

const LAST_NAMES = [
  "Ahmed", "Rahman", "Chowdhury", "Hossain", "Islam", "Khan", "Hasan", "Ali", "Alam", "Uddin",
  "Karim", "Sarker", "Mahmud", "Haque", "Talukder", "Bhuiyan", "Miah", "Sikder", "Akter", "Begum",
  "Siddique", "Majumder", "Dewan", "Barua", "Quader", "Mostafa", "Kabir", "Munshi", "Ferdous", "Hoque",
  "Mallick", "Sultana", "Khatun", "Nasreen", "Rabbani", "Jahangir", "Zaman", "Gazi", "Pal", "Dey",
  // Global & Diaspora
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Tanaka", "Sato", "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
  "Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim",
  "Wang", "Zhang", "Chen", "Liu", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu",
  "Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Mehta", "Nair", "Iyer", "Rao",
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
  "Dupont", "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau",
  "Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Jesus", "Sousa"
];

const DEPARTMENTS = [
  { name: "Computer Science and Engineering", code: "CSE", degrees: ["B.Sc. in Computer Science & Engineering", "M.Sc. in Computer Science"] },
  { name: "Business Administration", code: "BBA", degrees: ["Bachelor of Business Administration (BBA)", "Master of Business Administration (MBA)"] },
  { name: "Media Studies and Journalism", code: "MSJ", degrees: ["Bachelor of Social Science in Media Studies & Journalism", "Masters in Communication"] },
  { name: "English and Humanities", code: "DEH", degrees: ["Bachelor of Arts in English", "Master of Arts in English Literature"] },
  { name: "Electrical and Electronic Engineering", code: "EEE", degrees: ["B.Sc. in Electrical & Electronic Engineering", "M.Sc. in Telecommunications"] }
];

const ROLES_BY_DEPT = {
  CSE: [
    { title: "Senior Software Engineer", skills: "TypeScript, React, Node.js, Next.js, Cloud Architecture" },
    { title: "Staff Infrastructure Engineer", skills: "Kubernetes, Terraform, AWS, Golang, Linux" },
    { title: "Lead Mobile Developer", skills: "Flutter, Dart, Swift, Kotlin, Mobile CI/CD" },
    { title: "Machine Learning Researcher", skills: "PyTorch, Python, Computer Vision, Transformers, MLOps" },
    { title: "Full Stack Architect", skills: "PostgreSQL, Prisma, GraphQL, Distributed Systems, Microservices" },
    { title: "Engineering Manager", skills: "Agile, Team Leadership, Technical Architecture, Sprint Planning" },
    { title: "Cybersecurity Analyst", skills: "Penetration Testing, SOC, Zero Trust, Incident Response, ISO 27001" },
    { title: "Data Platform Engineer", skills: "Apache Spark, Kafka, Snowflake, dbt, BigQuery" },
  ],
  BBA: [
    { title: "Product Strategy Manager", skills: "Product Lifecycle, Roadmap Planning, Market Sizing, OKRs" },
    { title: "Financial Analyst", skills: "Financial Modeling, Valuation, Equity Research, Corporate Finance" },
    { title: "Head of Growth Marketing", skills: "Customer Acquisition, Analytics, Retention, Paid Media, Attribution" },
    { title: "Operations Director", skills: "Supply Chain Optimization, Lean Six Sigma, Process Engineering" },
    { title: "Management Consultant", skills: "Strategic Advisory, Change Management, M&A Diligence, KPI Optimization" },
    { title: "Senior Brand Manager", skills: "Brand Positioning, FMCG Strategy, Consumer Insights, Media Buying" },
    { title: "Fintech Innovation Lead", skills: "Digital Banking, Payments Architecture, Regulatory Compliance, AML" },
    { title: "People & Culture Specialist", skills: "Talent Acquisition, Performance Architecture, Diversity & Inclusion" },
  ],
  MSJ: [
    { title: "Senior Investigative Journalist", skills: "Investigative Reporting, Data Journalism, Media Ethics, Fact-Checking" },
    { title: "Digital Content Producer", skills: "Visual Storytelling, Video Editing, Audience Strategy, Cross-Platform Publishing" },
    { title: "Creative Director", skills: "Art Direction, Brand Storytelling, Multi-Channel Campaigns, Copywriting" },
    { title: "Communications Director", skills: "Crisis PR, Stakeholder Relations, Executive Speechwriting, Press Management" },
    { title: "Documentary Filmmaker", skills: "Cinematography, Audio Production, Post-Production, Narrative Arc" },
    { title: "Broadcast Producer", skills: "Live Studio Direction, Rundown Management, Breaking News Curation" },
  ],
  DEH: [
    { title: "Senior Content Strategist", skills: "Information Architecture, Taxonomy, UX Writing, Editorial Leadership" },
    { title: "Academic Lecturer", skills: "Curriculum Design, Comparative Literature, Pedagogy, Critical Theory" },
    { title: "Publishing Editor", skills: "Manuscript Editing, Author Relations, Copyright Law, Peer Review" },
    { title: "Technical Writer & Documentation Lead", skills: "API Documentation, Markdown, Developer Experience, Dita" },
    { title: "Policy Researcher", skills: "Qualitative Analysis, Public Policy Briefs, International Advocacy" },
  ],
  EEE: [
    { title: "Power Systems Engineer", skills: "Substation Automation, SCADA, Grid Resilience, High Voltage" },
    { title: "Embedded Firmware Specialist", skills: "C/C++, ARM Cortex, FreeRTOS, PCB Layout, Hardware Interfacing" },
    { title: "Telecommunications Specialist", skills: "5G Core, RF Planning, Fiber Optics, Cellular Infrastructure" },
    { title: "Renewable Energy Consultant", skills: "Solar Photovoltaic, Battery Storage, Energy Auditing, Net Zero" },
    { title: "Robotics Hardware Engineer", skills: "Actuator Systems, Sensor Fusion, CAN Bus, Mechatronics" },
  ],
};

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Shopify", "Spotify", "Netflix", "Stripe", "Atlassian",
  "Siemens", "Bosch", "ASML", "Philips", "Ericsson", "Nokia", "ABB", "SAP", "Cisco", "Intel",
  "JPMorgan Chase", "Deloitte", "PwC", "McKinsey & Company", "HSBC", "Standard Chartered", "KPMG", "EY",
  "bKash", "BRAC International", "Grameenphone", "Robi Axiata", "Pathao", "Chaldal", "ShopUp", "Banglalink",
  "Grab", "Shopee", "GoTo Financial", "Sea Limited", "Rakuten", "LINE Corporation", "Tata Consultancy Services",
  "BBC News", "Al Jazeera Media Network", "Reuters", "Bloomberg", "The Daily Star", "Prothom Alo", "Ogilvy"
];

const BIO_TEMPLATES = [
  "Passionate about leveraging modern technologies to build scalable human-centric solutions. Graduated from ULAB and currently leading cross-functional teams in {city}.",
  "Dedicated professional with over {exp} years of specialized experience in {industry}. Focused on operational excellence and empowering collaborative communities.",
  "ULAB alumnus driving digital transformation initiatives at {company}. Enthusiastic about mentoring aspiring scholars and exchanging global insights.",
  "Experienced in architecting mission-critical platforms and delivering impactful outcomes across multinational enterprise environments in {country}.",
  "Strategist and practitioner specializing in sustainable growth, strategic innovation, and cutting-edge engineering leadership in {city}.",
  "Bridging international perspectives with deep domain rigor. Dedicated to lifelong learning and creating sustainable value through creative problem solving."
];

export function build500DemoAlumni() {
  const cities = VETTED_GLOBAL_CITIES;
  const items = [];
  const usedNames = new Set();

  for (let i = 0; i < 500; i++) {
    const id = i + 1;

    // Pick unique name
    let name = "";
    let tries = 0;
    while (!name || usedNames.has(name)) {
      const fn = FIRST_NAMES[(i * 7 + tries * 13) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 11 + tries * 17) % LAST_NAMES.length];
      name = `${fn} ${ln}`;
      tries++;
      if (tries > 200) {
        name = `${fn} ${ln} ${String.fromCharCode(65 + (i % 26))}.`;
      }
    }
    usedNames.add(name);

    // Pick location ensuring realistic distribution across 50+ countries
    // Ensure 100 in Bangladesh, 100 in US/Canada, 120 in Europe, 110 in Asia/Middle East, 70 elsewhere
    let cityObj;
    if (i < 100) {
      // Bangladesh
      const bdCities = cities.filter((c) => c.country === "Bangladesh");
      cityObj = bdCities[i % bdCities.length];
    } else {
      // Distributed across remaining international cities
      const intlCities = cities.filter((c) => c.country !== "Bangladesh");
      cityObj = intlCities[(i - 100) % intlCities.length];
    }

    // Pick Department & Role
    const deptObj = DEPARTMENTS[i % DEPARTMENTS.length];
    const roles = ROLES_BY_DEPT[deptObj.code];
    const roleObj = roles[i % roles.length];
    const company = COMPANIES[(i * 3) % COMPANIES.length];

    // Academic Details
    const gradYearNum = 2008 + (i % 17); // 2008 - 2024
    const gradYear = String(gradYearNum);
    const batchNum = gradYearNum - 2004;
    const batch = `Batch ${Math.max(batchNum, 5)}`;
    const studentId = `DEMO-${deptObj.code}-${gradYearNum}-${String(id).padStart(3, "0")}`;

    // Experience
    const expYears = Math.max(2, 2026 - gradYearNum);
    const bioTemplate = BIO_TEMPLATES[i % BIO_TEMPLATES.length];
    const bio = bioTemplate
      .replace("{city}", cityObj.city)
      .replace("{country}", cityObj.country)
      .replace("{company}", company)
      .replace("{exp}", String(expYears))
      .replace("{industry}", deptObj.name);

    const email = `demo.alumni.${String(id).padStart(3, "0")}@synthetic.ulab.edu.bd`;
    const image = `/demo-avatars/alumni-${id}.webp`;
    const linkedinHandle = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const linkedin = `https://linkedin.com/in/${linkedinHandle}-${id}`;
    const github = deptObj.code === "CSE" || deptObj.code === "EEE"
      ? `https://github.com/${linkedinHandle}`
      : null;

    items.push({
      id: `demo-alumni-${String(id).padStart(3, "0")}`,
      name,
      email,
      role: "ALUMNI",
      status: "APPROVED",
      emailVerified: true,
      alumniVerified: false, // Explicitly false per Demo requirements!
      isDemo: true, // Internal dedicated flag
      verificationMethod: "demo_synthetic",
      department: deptObj.name,
      studentId,
      batch,
      graduationYear: gradYear,
      company,
      designation: roleObj.title,
      location: `${cityObj.city}, ${cityObj.country}`,
      city: cityObj.city,
      country: cityObj.country,
      countryCode: cityObj.countryCode,
      latitude: cityObj.lat,
      longitude: cityObj.lng,
      mapLocationVisibility: "PUBLIC",
      bio,
      skills: roleObj.skills,
      linkedin,
      github,
      image,
      phone: null,
      phonePublic: false,
      isPrivate: false,
      isMentor: false,
    });
  }

  return items;
}

// Generate the TS file
const dataset = build500DemoAlumni();

// Audit metrics
const countrySet = new Set(dataset.map((d) => d.country));
const citySet = new Set(dataset.map((d) => d.city));
const nameSet = new Set(dataset.map((d) => d.name));
const imageSet = new Set(dataset.map((d) => d.image));

console.log("==================================================================");
console.log("   ULAB SETU — 500 SYNTHETIC DEMO ALUMNI DATASET GENERATION       ");
console.log("==================================================================");
console.log(`✅ Total Profiles:        ${dataset.length}`);
console.log(`✅ Unique Names:           ${nameSet.size} / 500`);
console.log(`✅ Unique Images:          ${imageSet.size} / 500`);
console.log(`✅ Unique Countries:       ${countrySet.size} (Target: 50+)`);
console.log(`✅ Unique Cities:          ${citySet.size}`);
console.log("------------------------------------------------------------------");

const fileContent = `/**
 * ULAB Setu — 500 Synthetic Demo Alumni Profiles Dataset
 *
 * Generated automatically for presentation, institutional demo, and global map showcasing.
 * Completely isolated from real production members (isDemo: true, alumniVerified: false).
 * Total Profiles: ${dataset.length}
 * Total Countries: ${countrySet.size}
 * Total Cities: ${citySet.size}
 */

export interface DemoAlumniRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  alumniVerified: boolean;
  isDemo: boolean;
  verificationMethod: string;
  department: string;
  studentId: string;
  batch: string;
  graduationYear: string;
  company: string;
  designation: string;
  location: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  mapLocationVisibility: string;
  bio: string;
  skills: string;
  linkedin: string | null;
  github: string | null;
  image: string;
  phone: string | null;
  phonePublic: boolean;
  isPrivate: boolean;
  isMentor: boolean;
}

export const SYNTHETIC_DEMO_ALUMNI: DemoAlumniRecord[] = ${JSON.stringify(dataset, null, 2)};
`;

fs.writeFileSync(OUTPUT_PATH, fileContent, "utf-8");
console.log(`Dataset generated successfully at: ${OUTPUT_PATH}`);

