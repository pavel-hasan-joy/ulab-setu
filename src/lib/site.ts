// Everything university-specific lives here, so the site can be re-branded in one place.
export const site = {
  name: "ULAB Setu",
  tagline: "Where ULAB students meet the alumni who came before them.",
  university: "University of Liberal Arts Bangladesh",
  universityShort: "ULAB",
  universityUrl: "https://ulab.edu.bd",
  logo: "/ulab-logo.svg",
  logoDark: "/ulab-logo-white.svg",
  studentEmailDomain: "ulab.edu.bd",
};

export const departments = [
  "Business Administration",
  "Computer Science and Engineering",
  "Electrical & Electronic Engineering",
  "English and Humanities",
  "Environmental Science and Sustainability",
  "Media Studies and Journalism",
] as const;

export const jobTypes = ["Full-time", "Part-time", "Internship", "Contract"] as const;

export const jobCategories = [
  "Software & IT",
  "Engineering",
  "Marketing & Communication",
  "Finance & Accounting",
  "Media & Journalism",
  "Research & Education",
  "Design & Creative",
  "Operations & HR",
  "Development Sector / NGO",
  "Other",
] as const;

export const teacherRanks = ["Lecturer", "Senior Lecturer", "Assistant Professor", "Associate Professor", "Professor", "Adjunct Faculty"] as const;

export const postKinds = ["Notice", "Event", "Scholarship", "Research", "Opportunity"] as const;

/** Other job sites students can browse directly (all links open the site's own home or job search). */
export const jobPortals = [
  { name: "Bdjobs", url: "https://bdjobs.com", about: "Bangladesh's largest job site" },
  { name: "Teletalk All Jobs", url: "https://alljobs.teletalk.com.bd", about: "Government job circulars and online applications" },
  { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/search/?location=Bangladesh", about: "Professional jobs in Bangladesh" },
  { name: "Skill.jobs", url: "https://skill.jobs", about: "Skill-based jobs and training" },
  { name: "Chakri", url: "https://chakri.app", about: "AI job matching for Bangladesh" },
  { name: "BD Tech Jobs", url: "https://www.bdtechjobs.com", about: "Software and IT jobs" },
  { name: "Careerjet Bangladesh", url: "https://www.careerjet.com.bd", about: "Jobs from many sites in one search" },
  { name: "NextJobz", url: "https://nextjobz.com.bd", about: "Local jobs across the country" },
  { name: "Shomvob", url: "https://shomvob.com", about: "Entry-level and skilled jobs" },
  { name: "Himalayas", url: "https://himalayas.app/jobs", about: "Remote jobs open worldwide" },
] as const;
