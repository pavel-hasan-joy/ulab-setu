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
  // 1. Fetch live jobs directly from Bdjobs API
  try {
    const params = new URLSearchParams({
      isPro: "1",
      pg: String(page),
      rpp: "20",
      keyword: keywords,
    });
    const res = await fetch(`https://api.bdjobs.com/Jobs/api/JobSearch/GetJobSearch?${params}`, {
      headers: {
        "User-Agent": visitor.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      const rawList = [...(data.data ?? []), ...(data.premiumData ?? [])];
      if (rawList.length > 0) {
        const seen = new Set<string>();
        const jobs: ExternalJob[] = [];
        for (const j of rawList) {
          const id = String(j.Jobid || "").trim();
          if (!id || seen.has(id)) continue;
          seen.add(id);

          const rawSalary = typeof j.Salary === "string" ? j.Salary.trim() : "";
          const salary = rawSalary && rawSalary !== "--" ? rawSalary : null;
          const rawExcerpt = j.jobDescription || j.jobContext || j.eduRec || "";
          const excerpt = stripTags(rawExcerpt).slice(0, 200);

          jobs.push({
            id: `bd-${id}`,
            title: j.jobTitle?.trim() || "Job Opportunity",
            company: j.companyName?.trim() || "Company not listed",
            location: j.location?.trim() || "Bangladesh",
            category: guessCategory(j.jobTitle || ""),
            excerpt,
            posted: j.publishDate ? new Date(j.publishDate).toISOString() : null,
            salary,
            url: `https://jobs.bdjobs.com/jobdetails.asp?id=${encodeURIComponent(id)}&ln=1`,
            source: "Bdjobs",
          });
        }

        if (jobs.length > 0) {
          const totalHits = Number(data.common?.total_records_found) || jobs.length;
          return { jobs, total: totalHits, sample: false };
        }
      }
    }
  } catch (err) {
    console.error("Bdjobs live search error:", err);
  }

  // 2. Fallback to Careerjet if key is configured
  const key = process.env.CAREERJET_API_KEY;
  if (key) {
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
      if (res.ok) {
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
      }
    } catch (e) {
      console.error("Careerjet error:", e);
    }
  }

  // 3. Fallback to curated listings with direct search query URLs on Bdjobs
  const q = keywords.toLowerCase();
  const jobs = sampleBdJobs.filter(
    (j) => !q || `${j.title} ${j.company} ${j.category}`.toLowerCase().includes(q),
  );
  return { jobs, total: jobs.length, sample: true };
}

/** Remote jobs open to people in Bangladesh, from the free Himalayas API. Cached for an hour. */
export async function getRemoteJobs(keywords = ""): Promise<{ jobs: ExternalJob[]; error?: string }> {
  const params = new URLSearchParams({ country: "Bangladesh", sort: "recent" });
  if (keywords) params.set("q", keywords);
  try {
    const res = await fetch(`https://himalayas.app/jobs/api/search?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Himalayas responded ${res.status}`);
    const data = await res.json();
    const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
    const jobs: ExternalJob[] = rawJobs.map((j: HimalayasJob) => {
      const loc = j.locationRestrictions?.length ? j.locationRestrictions.join(", ") : "Worldwide (Remote)";
      const rawExcerpt = j.excerpt || "";
      const excerpt = stripTags(rawExcerpt).slice(0, 220);
      const min = j.minSalary ? Number(j.minSalary).toLocaleString() : null;
      const max = j.maxSalary ? Number(j.maxSalary).toLocaleString() : null;
      let salary: string | null = null;
      if ((min || max) && j.currency) {
        const range = min && max ? `${min}–${max}` : min || max;
        salary = `${j.currency} ${range} / ${j.salaryPeriod ?? "year"}`;
      }

      return {
        id: j.guid || `him-${j.companySlug || "job"}-${Date.now()}`,
        title: j.title || "Remote Role",
        company: j.companyName || "Global Tech",
        location: loc,
        category: j.parentCategories?.[0] ?? "Remote",
        excerpt,
        posted: j.pubDate ? new Date(Number(j.pubDate) * 1000).toISOString() : null,
        salary,
        url: j.applicationLink || "https://himalayas.app/jobs",
        source: "Himalayas",
      };
    });
    return { jobs };
  } catch (e) {
    return { jobs: [], error: (e as Error).message };
  }
}

type HimalayasJob = {
  guid: string;
  title: string;
  companyName: string;
  companySlug?: string;
  excerpt: string;
  locationRestrictions?: string[];
  parentCategories?: string[];
  pubDate?: string | number;
  minSalary?: string | number | null;
  maxSalary?: string | number | null;
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

// Fallback listings shown if live search is temporarily unreachable. Links point to valid Bdjobs search.
const sampleBdJobs: ExternalJob[] = [
  ["Junior Software Engineer (React)", "Sample Tech Ltd.", "Dhaka", "Software & IT", "react"],
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
  excerpt: "Curated opening. Click to view open circulars and apply directly on Bdjobs.",
  posted: daysAgo(i),
  salary: null,
  url: `https://jobs.bdjobs.com/jobsearch.asp?JobKeyword=${encodeURIComponent(q)}`,
  source: "Bdjobs",
}));
