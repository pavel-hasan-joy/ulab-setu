// Everything university-specific lives here, so the site can be re-branded in one place.
export const site = {
  name: "ULAB Setu",
  tagline: "Where ULAB students meet the alumni who came before them.",
  university: "University of Liberal Arts Bangladesh",
  universityShort: "ULAB",
  universityUrl: "https://ulab.edu.bd",
  logo: "/ulab-logo.svg",
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
