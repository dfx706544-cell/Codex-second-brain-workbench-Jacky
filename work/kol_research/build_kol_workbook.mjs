import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/嘉十一/Documents/Codex/2026-06-24/w/outputs";
const outputPath = `${outputDir}/us_tiktok_male_beauty_kol_shortlist.xlsx`;
const previewPath = "C:/Users/嘉十一/Documents/Codex/2026-06-24/w/work/kol_research/preview.png";

const rows = [
  {
    rank: 1,
    name: "Trevor Barrett",
    handle: "@trevorbarrett",
    tier: "KOL / educator",
    location: "US, NYC/PA",
    platforms: "TikTok, Instagram, Threads",
    followerSignal: "TikTok public page: 2.2M followers; 34.9M likes",
    publicContact: "trevor@thelilacagency.com",
    contactRoute: "Agency email / TikTok bio / Threads bio",
    contentFit: 5,
    visualFit: 5,
    usFit: 5,
    reach: 5,
    contactability: 5,
    costEfficiency: 3,
    lashFit: "Very high",
    why: "Makeup teacher positioning is ideal for tutorial-led false lash content: application, beginner tips, lash style comparisons, and problem-solution demos.",
    evidence: "TikTok bio says Makeup Teacher; agency/search results show beauty creator and makeup artistry positioning.",
    source1: "https://www.tiktok.com/@trevorbarrett",
    source2: "https://www.thelilacagency.com/creators-1/pau-fabio-ade3h",
    source3: "https://themakeupshow.com/speakers/trevor-barrett/",
    platformCheck: "Verify recent 30-day beauty video views, US female audience share, lash/eye content history, and commerce conversion on FastMoss/Kalodata."
  },
  {
    rank: 2,
    name: "Brayan",
    handle: "@brayannbc",
    tier: "KOL / beauty MUA",
    location: "US-based, Spanish-speaking audience",
    platforms: "TikTok, Instagram, Facebook",
    followerSignal: "Favikon: 3.6M+ across TikTok and Instagram; Instagram search result shows 2M followers",
    publicContact: "bbc.business@hotmail.com",
    contactRoute: "TikTok bio / Instagram bio / Facebook public contact",
    contentFit: 5,
    visualFit: 5,
    usFit: 5,
    reach: 5,
    contactability: 5,
    costEfficiency: 3,
    lashFit: "Very high",
    why: "Dynamic makeup tutorials and product reviews fit lash transformation content; Spanish/Latino US audience can broaden US TikTok Shop reach.",
    evidence: "Public TikTok and Instagram snippets show beauty creator/MUA positioning and business email.",
    source1: "https://www.tiktok.com/@brayannbc",
    source2: "https://www.favikon.com/blog/who-is-brayan-aka-brayannbc",
    source3: "https://www.instagram.com/brayannbc/",
    platformCheck: "Verify US audience mix, beauty category performance, recent sponsored content, and TikTok Shop affiliate history."
  },
  {
    rank: 3,
    name: "Aditya Madiraju",
    handle: "@adityamadiraju",
    tier: "KOL / certified MUA",
    location: "US, New Jersey",
    platforms: "Instagram, TikTok, ShopMy",
    followerSignal: "Instagram public result: 3M followers; Beauty Independent/People report 5M across platforms",
    publicContact: "haley.walsh@thedigitalbrandarchitects.com",
    contactRoute: "Instagram bio / management email",
    contentFit: 5,
    visualFit: 5,
    usFit: 5,
    reach: 5,
    contactability: 5,
    costEfficiency: 2,
    lashFit: "Very high",
    why: "Full-glam and technique-led makeup content is a direct match for false lash education, before-after, and premium beauty storytelling.",
    evidence: "Public profile describes him as Makeup Nerd and certified makeup artist; brand partnership email is public.",
    source1: "https://www.instagram.com/adityamadiraju/",
    source2: "https://www.beautyindependent.com/aditya-madiraju-brand-deal-red-flags-ai-content-creators-influence-endures/",
    source3: "https://shopmy.us/shop/adityamadiraju",
    platformCheck: "Verify audience age/gender, short-video views on eye looks, and expected CPM/fee before outreach."
  },
  {
    rank: 4,
    name: "Abdullah Zaidi",
    handle: "@thisguyabdullah",
    tier: "Emerging KOL / beauty-comedy crossover",
    location: "Toronto, North America",
    platforms: "TikTok, Instagram",
    followerSignal: "Instagram public result: 702K followers; press covers beauty creator positioning",
    publicContact: "management@thisguyabdullah.com",
    contactRoute: "Instagram bio / management email",
    contentFit: 4,
    visualFit: 5,
    usFit: 4,
    reach: 4,
    contactability: 5,
    costEfficiency: 4,
    lashFit: "High",
    why: "Straight male beauty journey angle can reduce category barriers and make false lashes feel approachable for broader Gen Z audiences.",
    evidence: "Press coverage frames him as a comedy creator turned beauty influencer; public Instagram management email available.",
    source1: "https://www.instagram.com/thisguyabdullah/",
    source2: "https://adage.com/influencers-creators/aa-creator-beauty-influencer-tmobile-coachella/",
    source3: "https://thisguyabdullah.com/",
    platformCheck: "Verify US follower share, beauty video engagement, and whether lash content fits his current content tone."
  },
  {
    rank: 5,
    name: "CheckoutJon / Jon Richardson",
    handle: "@CheckoutJon",
    tier: "KOC / grooming-beauty creator",
    location: "US",
    platforms: "TikTok, Instagram, website",
    followerSignal: "Partnership page: 222K TikTok followers, 42K Instagram followers, 20-50M weekly reach claim",
    publicContact: "Jon@Checkoutjon.com",
    contactRoute: "Website contact / partnership page",
    contentFit: 4,
    visualFit: 4,
    usFit: 5,
    reach: 4,
    contactability: 5,
    costEfficiency: 5,
    lashFit: "Medium-high",
    why: "Male self-care and grooming angle is useful for soft-launching lashes as confidence/self-care rather than only glam makeup.",
    evidence: "Own site positions him around beauty, grooming, skincare, travel, and lifestyle with public partnership contact.",
    source1: "https://www.checkoutjon.com/partnerships",
    source2: "https://www.checkoutjon.com/contact",
    source3: "https://www.checkoutjon.com/checkoutjon",
    platformCheck: "Verify whether recent audience responds to makeup/eye-product content, not only skincare and grooming."
  },
  {
    rank: 6,
    name: "Seth O'Brien",
    handle: "@sethobrien",
    tier: "KOL / beauty personality",
    location: "US",
    platforms: "TikTok, Instagram, YouTube",
    followerSignal: "Sportskeeda/GlamCode: 5M+ TikTok followers; Fashion Monitor notes strong TikTok likes and Instagram presence",
    publicContact: "Platform DM; public email requires identity verification",
    contactRoute: "TikTok/Instagram DM or agency lookup",
    contentFit: 5,
    visualFit: 5,
    usFit: 5,
    reach: 5,
    contactability: 2,
    costEfficiency: 3,
    lashFit: "Very high",
    why: "Beauty and makeup tutorial/comedy content can make false lash demos entertaining and viral-friendly.",
    evidence: "Multiple public profiles describe him as a beauty and makeup enthusiast with large TikTok following.",
    source1: "https://wiki.sportskeeda.com/tiktok/who-is-seth-obrien",
    source2: "https://www.fashionmonitor.com/blog/Tmz/10-beauty-tik-tokers-you-should-follow",
    source3: "https://glamcodemedia.com/seth-obrien-biography-career-age-family-networth/",
    platformCheck: "Confirm official current handle, business contact, US audience share, and recent makeup/lash content before outreach."
  },
  {
    rank: 7,
    name: "Painted by Spencer / Spencer Hedges",
    handle: "@paintedbyspencer",
    tier: "KOL / glam makeup artist",
    location: "US, Los Angeles",
    platforms: "Instagram, YouTube, TikTok",
    followerSignal: "Press describes millions of followers and global beauty creator status",
    publicContact: "Instagram DM / YouTube business inquiry / management lookup",
    contactRoute: "Social DM or management inquiry",
    contentFit: 5,
    visualFit: 5,
    usFit: 5,
    reach: 4,
    contactability: 3,
    costEfficiency: 2,
    lashFit: "Very high",
    why: "Cinematic glam transformations and eye-focused artistry are highly compatible with premium false lash content.",
    evidence: "Public profiles and press describe him as a self-taught makeup artist and global beauty creator.",
    source1: "https://www.famousbirthdays.com/people/paintedbyspencer.html",
    source2: "https://gayety.com/spencer-hedges-beauty-and-empire",
    source3: "https://www.youtube.com/@PAINTEDBYSPENCER/videos",
    platformCheck: "Use FastMoss/Kalodata or social platform analytics to validate recent short-form performance and contact route."
  },
  {
    rank: 8,
    name: "Bach Buquen",
    handle: "@bachbuquen",
    tier: "Mega KOL / Gen Z male makeup icon",
    location: "France, global Gen Z reach",
    platforms: "TikTok, Instagram, Snapchat",
    followerSignal: "TikTok public page: 8.9M followers, 581.8M likes",
    publicContact: "bachbuquenteam@unitedtalent.com",
    contactRoute: "TikTok bio / UTA team email",
    contentFit: 4,
    visualFit: 5,
    usFit: 3,
    reach: 5,
    contactability: 5,
    costEfficiency: 1,
    lashFit: "High",
    why: "Public-makeup and attractive Gen Z male image can normalize beauty products for male and female audiences; best for brand awareness, not low-cost UGC.",
    evidence: "TikTok bio and major media coverage describe him as a male makeup influencer/model with viral reach.",
    source1: "https://www.tiktok.com/@bachbuquen",
    source2: "https://www.businessoffashion.com/articles/beauty/the-hetero-tiktok-it-boy-whos-getting-men-to-wear-makeup/",
    source3: "https://www.interviewmagazine.com/culture/bach-buquen",
    platformCheck: "Only pursue if budget fits; verify US audience share and brand-safety fit for false lashes."
  },
  {
    rank: 9,
    name: "Keagan Ludick",
    handle: "@keagan-ludick / platform profile",
    tier: "KOC / UGC creator",
    location: "US, Los Angeles",
    platforms: "TikTok, JoinBrands",
    followerSignal: "JoinBrands profile describes LA influencer focused on skincare, self-care, and breaking boy-content stereotypes",
    publicContact: "JoinBrands platform booking",
    contactRoute: "JoinBrands profile",
    contentFit: 3,
    visualFit: 4,
    usFit: 5,
    reach: 2,
    contactability: 4,
    costEfficiency: 5,
    lashFit: "Medium",
    why: "Good for affordable UGC tests and male self-care framing; needs concept direction to move from skincare into lashes.",
    evidence: "JoinBrands profile explicitly says he wants to break boy content stereotypes with skincare/self-care.",
    source1: "https://joinbrands.com/@keagan-ludick",
    source2: "https://www.fastmoss.com/zh/influencer/search",
    source3: "https://www.kalodata.com/creator",
    platformCheck: "Verify actual TikTok handle, video quality, comfort with eye/lash product demos, and usage rights pricing."
  },
  {
    rank: 10,
    name: "Sebastian Vidal",
    handle: "Sebastian Vidal",
    tier: "UGC / micro creator",
    location: "US, New York City",
    platforms: "Portfolio, social platforms",
    followerSignal: "Portfolio positions him as NYC UGC creator in beauty, wellness, travel, home and lifestyle",
    publicContact: "Website contact form",
    contactRoute: "Portfolio Get In Touch",
    contentFit: 3,
    visualFit: 4,
    usFit: 5,
    reach: 2,
    contactability: 4,
    costEfficiency: 5,
    lashFit: "Medium",
    why: "Good UGC candidate for polished male beauty/self-care assets, testimonial videos, and paid media usage rights.",
    evidence: "Portfolio directly lists beauty and wellness UGC creator positioning and NYC availability.",
    source1: "https://sebastiannvidal.com/",
    source2: "https://www.kalodata.com/creator",
    source3: "https://www.fastmoss.com/zh/influencer/search",
    platformCheck: "Confirm exact social handles, beauty video samples, quote, and whether he can produce lash application footage."
  }
];

const backupRows = [
  ["Giordano Dal Bon", "Men's beauty/grooming UGC expert", "Italy", "https://psychelicht.com/en/giordano-dal-bon-mens-beauty-ugc-creator-italy/", "Good backup for UGC if US-only requirement is relaxed."],
  ["Nicholas Cicio", "Male UGC content creator", "US / travel", "http://nicholascreatesllc.com/", "Potential UGC backup; verify beauty category examples."],
  ["Bretman Rock", "Mega male beauty/lifestyle creator", "US/Hawaii", "https://influencers.feedspot.com/male_makeup_instagram_influencers/", "Too expensive for first outreach but useful for benchmark."],
  ["Manny MUA", "Mega male beauty founder/MUA", "US", "https://www.instagram.com/mannymua733/", "Good benchmark or paid partnership only if budget is high."],
  ["Patrick Starrr", "Mega beauty creator/founder", "US", "https://www.instagram.com/patrickstarrr/", "Good awareness benchmark; likely high fee."]
];

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const candidates = workbook.worksheets.add("Recommended_10");
const quick = workbook.worksheets.add("Top10_Quick_View");
const outreach = workbook.worksheets.add("Outreach");
const platform = workbook.worksheets.add("Platform_Checklist");
const backups = workbook.worksheets.add("Backup_Candidates");

for (const sheet of [summary, candidates, quick, outreach, platform, backups]) {
  sheet.showGridLines = false;
}

summary.getRange("A1:H1").merge();
summary.getRange("A1").values = [["US TikTok Male Beauty Creator Shortlist for False Lashes"]];
summary.getRange("A1").format = {
  fill: "#123D3A",
  font: { bold: true, color: "#FFFFFF", size: 16 },
  horizontalAlignment: "center",
};
summary.getRange("A3:B10").values = [
  ["Requester", "TK cross-border ecommerce US BD"],
  ["Objective", "Find 10 male beauty / grooming / UGC creators suitable for false lash product outreach"],
  ["Primary platforms checked", "FastMoss and Kalodata opened; public pages accessible, internal creator database requires login for full filtering"],
  ["Research method", "Public web search + AnySearch + platform public landing pages; all contacts are public or platform-route only"],
  ["Privacy boundary", "No private contact scraping; use only public emails, agency contacts, platform booking routes, or DM"],
  ["Best first test mix", "3 educator/glam KOLs + 3 mid-tier beauty personalities + 4 UGC/KOC creators"],
  ["Next required action", "Log into FastMoss/Kalodata and validate recent 30-day views, audience location, engagement, and TikTok Shop affiliate data"],
  ["Generated date", new Date()],
];
summary.getRange("A3:A10").format = { fill: "#E7F1EE", font: { bold: true, color: "#123D3A" } };
summary.getRange("B3:B10").format = { wrapText: true };
summary.getRange("B10").setNumberFormat("yyyy-mm-dd");
summary.getRange("A12:D18").values = [
  ["Score Component", "Weight", "Meaning", "Notes"],
  ["Content fit", 0.25, "Makeup / beauty / eye-product relevance", "Higher if creator already teaches makeup or glam"],
  ["Visual/camera fit", 0.15, "On-camera aesthetic and beauty-product presentation fit", "Professional shorthand, not a protected-trait score"],
  ["US market fit", 0.15, "US audience or North America relevance", "Important for US TikTok Shop BD"],
  ["Reach", 0.15, "Scale of visible audience signal", "Needs FastMoss/Kalodata verification"],
  ["Contactability", 0.15, "Public email / agency / platform route", "Private data not used"],
  ["Cost efficiency", 0.15, "Likely BD feasibility", "UGC/KOC usually scores higher"]
];
summary.getRange("A12:D12").format = { fill: "#123D3A", font: { bold: true, color: "#FFFFFF" } };
summary.getRange("B13:B18").setNumberFormat("0%");
summary.getRange("A12:D18").format.borders = { preset: "all", style: "thin", color: "#C9D5D2" };
summary.getRange("A:D").format.autofitColumns();
summary.getRange("B:B").format.columnWidth = 40;
summary.freezePanes.freezeRows(1);

const headers = [
  "Rank", "Creator", "Handle", "Tier", "Location / Market", "Platforms",
  "Follower / Data Signal", "Public Contact", "Contact Route",
  "Content Fit", "Visual Fit", "US Fit", "Reach", "Contactability", "Cost Efficiency",
  "Weighted Score", "Lash Fit", "Why Selected", "Evidence", "Source 1", "Source 2", "Source 3",
  "FastMoss / Kalodata Check", "Outreach Status", "Owner", "Notes"
];
const data = rows.map((r) => [
  r.rank, r.name, r.handle, r.tier, r.location, r.platforms, r.followerSignal,
  r.publicContact, r.contactRoute, r.contentFit, r.visualFit, r.usFit, r.reach,
  r.contactability, r.costEfficiency, null, r.lashFit, r.why, r.evidence,
  r.source1, r.source2, r.source3, r.platformCheck, "Not contacted", "", ""
]);

candidates.getRange("A1:Z1").values = [headers];
candidates.getRange(`A2:Z${data.length + 1}`).values = data;
candidates.getRange("P2").formulas = [["=ROUND((J2*25+K2*15+L2*15+M2*15+N2*15+O2*15)/5,1)"]];
candidates.getRange(`P2:P${data.length + 1}`).fillDown();
const table = candidates.tables.add(`A1:Z${data.length + 1}`, true, "RecommendedCreators");
table.style = "TableStyleMedium2";
candidates.freezePanes.freezeRows(1);
candidates.freezePanes.freezeColumns(3);
candidates.getRange("A1:Z1").format = { fill: "#123D3A", font: { bold: true, color: "#FFFFFF" } };
candidates.getRange(`J2:P${data.length + 1}`).format.horizontalAlignment = "center";
candidates.getRange(`P2:P${data.length + 1}`).setNumberFormat("0.0");
candidates.getRange(`R2:S${data.length + 1}`).format.wrapText = true;
candidates.getRange(`G2:I${data.length + 1}`).format.wrapText = true;
candidates.getRange(`T2:W${data.length + 1}`).format.wrapText = true;
candidates.getRange(`X2:X${data.length + 1}`).dataValidation = { rule: { type: "list", values: ["Not contacted", "Shortlisted", "Contacted", "Replied", "Rejected", "Negotiating"] } };
candidates.getRange(`A1:Z${data.length + 1}`).format.borders = { preset: "all", style: "thin", color: "#D7E0DD" };
candidates.getRange("A:A").format.columnWidth = 8;
candidates.getRange("B:B").format.columnWidth = 22;
candidates.getRange("C:C").format.columnWidth = 18;
candidates.getRange("D:F").format.columnWidth = 20;
candidates.getRange("G:I").format.columnWidth = 30;
candidates.getRange("J:P").format.columnWidth = 12;
candidates.getRange("R:S").format.columnWidth = 46;
candidates.getRange("T:W").format.columnWidth = 34;
candidates.getRange("X:Z").format.columnWidth = 20;

quick.getRange("A1:K1").values = [[
  "Rank", "Creator", "Handle", "Tier", "Public Contact", "Weighted Score",
  "Lash Fit", "Best Use", "Key Reason", "Primary Source", "Need Platform Check"
]];
quick.getRange(`A2:K${rows.length + 1}`).values = rows.map((r) => [
  r.rank,
  r.name,
  r.handle,
  r.tier,
  r.publicContact,
  null,
  r.lashFit,
  r.costEfficiency >= 5 ? "UGC/KOC test" : r.reach >= 5 ? "Awareness / KOL" : "Mid-tier collab",
  r.why,
  r.source1,
  r.platformCheck
]);
quick.getRange("F2").formulas = [["='Recommended_10'!P2"]];
quick.getRange(`F2:F${rows.length + 1}`).fillDown();
const quickTable = quick.tables.add(`A1:K${rows.length + 1}`, true, "QuickView");
quickTable.style = "TableStyleMedium4";
quick.freezePanes.freezeRows(1);
quick.getRange("A1:K1").format = { fill: "#123D3A", font: { bold: true, color: "#FFFFFF" } };
quick.getRange(`A1:K${rows.length + 1}`).format.borders = { preset: "all", style: "thin", color: "#D7E0DD" };
quick.getRange(`F2:F${rows.length + 1}`).setNumberFormat("0.0");
quick.getRange(`I2:K${rows.length + 1}`).format.wrapText = true;
quick.getRange("A:A").format.columnWidth = 8;
quick.getRange("B:B").format.columnWidth = 22;
quick.getRange("C:C").format.columnWidth = 20;
quick.getRange("D:E").format.columnWidth = 26;
quick.getRange("F:H").format.columnWidth = 16;
quick.getRange("I:I").format.columnWidth = 48;
quick.getRange("J:J").format.columnWidth = 42;
quick.getRange("K:K").format.columnWidth = 52;

outreach.getRange("A1:F1").values = [["Use Case", "Subject / Hook", "Message Template", "Best For", "Follow-up Timing", "Notes"]];
outreach.getRange("A2:F5").values = [
  [
    "KOL educator",
    "False lash tutorial collaboration for your beauty audience",
    "Hi {Name}, I am {Your Name}, BD for a US TikTok Shop false lash brand. I loved your makeup education content, especially how clearly you explain application details. We would like to explore a paid tutorial or try-on collaboration around lightweight false lashes for everyday and glam looks. Could you share your rate card, TikTok/IG deliverable options, and usage-rights pricing?",
    "Trevor, Aditya, Spencer",
    "3 business days",
    "Ask for usage rights and raw footage separately."
  ],
  [
    "Gen Z beauty personality",
    "Testing genderless lash looks with your audience",
    "Hi {Name}, we are looking for creators who can make eye makeup and lashes feel fun, wearable, and approachable. Your content style fits that direction well. Would you be open to testing a few lash styles and creating one short try-on video plus one organic-style UGC asset?",
    "Abdullah, Bach, Seth, Brayan",
    "2-3 business days",
    "For mega KOLs, route through management first."
  ],
  [
    "KOC / UGC",
    "UGC brief: natural false lash demo for paid social",
    "Hi {Name}, we are sourcing male beauty/self-care creators for a false lash UGC test. The brief is simple: unboxing, close-up application, before/after, comfort claim, and final look. Can you quote 2 vertical videos, 15-30 seconds each, with 6-month paid usage rights?",
    "CheckoutJon, Keagan, Sebastian",
    "2 business days",
    "Good first round for cost-efficient creative testing."
  ],
  [
    "Data request",
    "Quick data check before collaboration",
    "Before confirming, could you share recent 30-day average views, audience country split, gender split, age range, and any beauty/TikTok Shop affiliate performance you can disclose?",
    "All creators",
    "After reply",
    "Compare against FastMoss/Kalodata when logged in."
  ]
];
outreach.getRange("A1:F1").format = { fill: "#123D3A", font: { bold: true, color: "#FFFFFF" } };
outreach.getRange("A1:F5").format.borders = { preset: "all", style: "thin", color: "#D7E0DD" };
outreach.getRange("C:C").format.columnWidth = 80;
outreach.getRange("A:B").format.columnWidth = 24;
outreach.getRange("D:F").format.columnWidth = 26;
outreach.getRange("A1:F5").format.wrapText = true;
outreach.freezePanes.freezeRows(1);

platform.getRange("A1:E1").values = [["Step", "FastMoss / Kalodata Action", "Field to Capture", "Why It Matters", "Decision Rule"]];
platform.getRange("A2:E13").values = [
  [1, "Open Creator / Influencer search", "Creator handle", "Confirm official account and avoid duplicates", "Match exact handle before outreach"],
  [2, "Filter market", "US audience %, US/CA reach", "US BD relevance", "Prefer high US share; keep global KOL only for awareness"],
  [3, "Filter category", "Beauty / makeup / skincare / grooming", "Product fit", "Reject if no recent beauty/self-care content"],
  [4, "Review recent videos", "30-day views, median views, viral spikes", "Avoid outdated followers", "Prefer stable median views plus recent activity"],
  [5, "Review engagement", "Like/comment/share/save rate", "Creative resonance", "Check comments for purchase intent and lash/eye questions"],
  [6, "Search keywords", "lash, lashes, eye makeup, mascara, glam, tutorial", "False lash relevance", "Prioritize creators with eye-product content"],
  [7, "Review commerce history", "TikTok Shop affiliate, brands, GMV if available", "Conversion likelihood", "Prioritize proven affiliate creators"],
  [8, "Review brand safety", "Controversy, adult themes, politics risk", "Avoid campaign risk", "Exclude high-risk creators"],
  [9, "Estimate cost", "Rate card, agency fee, UGC usage rights", "Budget planning", "Start with KOC/UGC for creative tests"],
  [10, "Prepare outreach", "Email/DM, agency, platform booking", "Execution", "Use public route only"],
  [11, "Track status", "Contacted/replied/quote/sample sent", "BD pipeline", "Update Recommended_10 sheet"],
  [12, "Post-campaign", "Views, CTR, CVR, GMV, CAC", "Learning loop", "Feed results back into creator score"]
];
platform.getRange("A1:E1").format = { fill: "#123D3A", font: { bold: true, color: "#FFFFFF" } };
platform.getRange("A1:E13").format.borders = { preset: "all", style: "thin", color: "#D7E0DD" };
platform.getRange("A:E").format.wrapText = true;
platform.getRange("A:A").format.columnWidth = 8;
platform.getRange("B:E").format.columnWidth = 34;
platform.freezePanes.freezeRows(1);

backups.getRange("A1:E1").values = [["Creator", "Positioning", "Market", "Source", "Why Backup"]];
backups.getRange(`A2:E${backupRows.length + 1}`).values = backupRows;
backups.getRange("A1:E1").format = { fill: "#123D3A", font: { bold: true, color: "#FFFFFF" } };
backups.getRange(`A1:E${backupRows.length + 1}`).format.borders = { preset: "all", style: "thin", color: "#D7E0DD" };
backups.getRange("A:E").format.wrapText = true;
backups.getRange("A:E").format.autofitColumns();
backups.getRange("D:D").format.columnWidth = 54;
backups.freezePanes.freezeRows(1);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({ sheetName: "Top10_Quick_View", range: "A1:K11", scale: 1, format: "png" });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, previewPath }, null, 2));
