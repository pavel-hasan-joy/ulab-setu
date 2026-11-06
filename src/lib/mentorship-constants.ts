export const MENTORSHIP_TOPICS = [
  "Career Guidance",
  "Resume & CV Review",
  "Technical Interview Preparation",
  "Software Engineering Best Practices",
  "Industry & Role Transition",
  "Higher Studies & Scholarships",
  "Academic Research & Publications",
  "Startup & Entrepreneurship",
  "Networking & Communication",
] as const;

export type MentorshipTopic = (typeof MENTORSHIP_TOPICS)[number];

export type MentorshipStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type SessionFormat = "ONLINE" | "IN_PERSON" | "HYBRID";

export type MentorAvailabilityStatus =
  | "AVAILABLE"
  | "TEMPORARILY_UNAVAILABLE"
  | "FULLY_BOOKED";

export type CareerMentorProfileData = {
  isActive: boolean;
  status?: MentorAvailabilityStatus;
  bio?: string;
  careerField?: string;
  company?: string;
  position?: string;
  department?: string;
  expertise?: string;
  skills?: string;
  topics?: string[] | string;
  yearsOfExperience?: number;
  preferredSessionType?: string;
  sessionFormats?: SessionFormat[];
  communicationMethod?: "GOOGLE_MEET" | "ZOOM" | "MS_TEAMS" | "CAMPUS_OFFICE" | "PHONE" | "OTHER";
  availableDays?: string[];
  preferredTimeSlots?: string[];
  maxMentees?: number;
  expectations?: string;
};

export type FindMentorsFilters = {
  search?: string;
  role?: "ALL" | "ALUMNI" | "TEACHER";
  department?: string;
  topic?: string;
  sessionFormat?: "ALL" | "ONLINE" | "IN_PERSON" | "HYBRID";
  experienceLevel?: "ALL" | "ENTRY" | "MID" | "SENIOR";
  sort?: "recent" | "experience" | "alpha";
  page?: number;
  pageSize?: number;
};

