import "server-only";

export type ExternalJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  excerpt: string;
  posted: string | null;
  salary: string | null;
  url: string;
  source: string;
};

type Visitor = { ip: string; userAgent: string };

/**
 * Bangladesh jobs from Careerjet (aggregates Bdjobs and other BD sites).
 * Careerjet requires the real visitor's IP and user agent on every call, so this runs per request.
 * Without an API key we return sample jobs so the page still works during development.
 */
export async function getBangladeshJobs(
  { keywords = "", page = 1 }: { keywords?: string; page?: number },
  visitor: Visitor,
): Promise<{ jobs: ExternalJob[]; total: number; sample: boolean; error?: string }> {
  const key = process.env.CAREERJET_API_KEY;
  if (!key) {
    const q = keywords.toLowerCase();
    const jobs = sampleBdJobs.filter(
      (j) => !q || `${j.title} ${j.company} ${j.category}`.toLowerCase().includes(q),
    );
    return { jobs, total: jobs.length, sample: true };
  }

  const params = new URLSearchParams({
    locale_code: "en_BD",
    keywords,
    sort: "date",
    page: String(page),
    page_size: "20",
    fragment_size: "200",
    user_ip: visitor.ip,
    user_agent: visitor.userAgent,
  });

  try {
    const res = await fetch(`https://search.api.careerjet.net/v4/query?${params}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Careerjet responded ${res.status}`);
    const data = await res.json();
    const jobs: ExternalJob[] = (data.jobs ?? []).map((j: Record<string, string>, i: number) => ({
      id: `cj-${page}-${i}`,
      title: j.title,
      company: j.company || "Company not listed",
      location: j.locations || "Bangladesh",
      category: guessCategory(j.title),
      excerpt: stripTags(j.description ?? ""),
      posted: j.date ? new Date(j.date).toISOString() : null,
      salary: j.salary || null,
      url: j.url,
      source: "Careerjet",
    }));
    return { jobs, total: data.hits ?? jobs.length, sample: false };
  } catch (e) {
    return { jobs: [], total: 0, sample: false, error: (e as Error).message };
  }
}

/** Remote jobs open to people in Bangladesh, from the free Himalayas API. Cached for an hour. */
export async function getRemoteJobs(keywords = ""): Promise<{ jobs: ExternalJob[]; error?: string }> {
  const params = new URLSearchParams({ country: "Bangladesh", sort: "recent" });
  if (keywords) params.set("q", keywords);
  try {
    const res = await fetch(`https://himalayas.app/jobs/api/search?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Himalayas responded ${res.status}`);
    const data = await res.json();
    const jobs: ExternalJob[] = (data.jobs ?? []).map((j: HimalayasJob) => ({
      id: j.guid,
      title: j.title,
      company: j.companyName,
      location: j.locationRestrictions?.length ? j.locationRestrictions.join(", ") : "Anywhere",
      category: j.parentCategories?.[0] ?? "Remote",
      excerpt: j.excerpt,
      posted: j.pubDate ? new Date(Number(j.pubDate) * 1000).toISOString() : null,
      salary:
        j.minSalary && j.currency
          ? `${j.currency} ${Number(j.minSalary).toLocaleString()}${j.maxSalary ? `–${Number(j.maxSalary).toLocaleString()}` : ""} / ${j.salaryPeriod ?? "year"}`
          : null,
      url: j.applicationLink,
      source: "Himalayas",
    }));
    return { jobs };
  } catch (e) {
    return { jobs: [], error: (e as Error).message };
  }
}

type HimalayasJob = {
  guid: string;
  title: string;
  companyName: string;
  excerpt: string;
  locationRestrictions?: string[];
  parentCategories?: string[];
  pubDate?: string;
  minSalary?: string | null;
  maxSalary?: string | null;
  currency?: string | null;
  salaryPeriod?: string | null;
  applicationLink: string;
};

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function guessCategory(title: string) {
  const t = title.toLowerCase();
  if (/(developer|engineer.*software|software|programmer|devops|it |data|web)/.test(t)) return "Software & IT";
  if (/(engineer|technician|electrical|civil|mechanical)/.test(t)) return "Engineering";
  if (/(market|sales|brand|communication|content)/.test(t)) return "Marketing & Communication";
  if (/(account|finance|audit|bank)/.test(t)) return "Finance & Accounting";
  if (/(teacher|lecturer|research|instructor)/.test(t)) return "Research & Education";
  if (/(design|graphic|ui|ux|video)/.test(t)) return "Design & Creative";
  if (/(hr|human resource|admin|operation|officer)/.test(t)) return "Operations & HR";
  return "Other";
}

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

// Shown only while CAREERJET_API_KEY is empty. Links point to the real Bdjobs search.
const sampleBdJobs: ExternalJob[] = [
  ["Junior Software Engineer (React)", "Sample Tech Ltd.", "Dhaka", "Software & IT", "react developer"],
  ["Executive, Brand Marketing", "Sample FMCG Company", "Dhaka (Gulshan)", "Marketing & Communication", "brand marketing"],
  ["Assistant Officer, Accounts", "Sample Group of Industries", "Chattogram", "Finance & Accounting", "accounts officer"],
  ["Electrical Engineer (Substation)", "Sample Power Solutions", "Gazipur", "Engineering", "electrical engineer"],
  ["Research Assistant", "Sample Development Foundation", "Dhaka", "Development Sector / NGO", "research assistant"],
  ["Content Writer (English)", "Sample Media House", "Dhaka", "Media & Journalism", "content writer"],
  ["UI/UX Designer", "Sample Software Studio", "Dhaka (Banani)", "Design & Creative", "ui ux designer"],
  ["HR Executive", "Sample Garments Ltd.", "Narayanganj", "Operations & HR", "hr executive"],
].map(([title, company, location, category, q], i) => ({
  id: `sample-${i}`,
  title,
  company,
  location,
  category,
  excerpt: "Sample listing shown until the Careerjet API key is added. Click to search similar jobs on Bdjobs.",
  posted: daysAgo(i),
  salary: null,
  url: `https://bdjobs.com/h/jobs?keyword=${encodeURIComponent(q)}`,
  source: "Sample",
}));
