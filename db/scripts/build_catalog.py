"""Builds db/seed/02_careers_courses.sql from the curated catalog in db/data/, so the data stays reviewable.

    python db/scripts/build_catalog.py           # validate and check the seed file is up to date
    python db/scripts/build_catalog.py --write   # validate and rewrite the seed file

Inputs (db/data/):
  programs.csv  degree programmes: level, duration, the Class 11-12 streams that may enter (the regulator's
                minimum) and the streams it naturally follows, with the rule and its source
  careers.csv   careers: domain, O*NET code (trait weights), the programmes that lead there, education path
  colleges.csv  colleges: city, state, NIRF category and rank, fee group, fee source, entrance exam, and the
                programmes they offer ("key", "key@exam", "key=fee_ref" or "key@exam=fee_ref")
  fees.csv      fee sources: annual fee in rupees, estimated or not, source text, URL, date

Rules:
  tier   1 = NIRF rank <= 50 in its category (<= 20 for Medical, Dental, Law, Architecture, where NIRF ranks
         only about 40-50), 2 = ranked lower or a national institute NIRF doesn't rank (ini = y),
         3 = not NIRF-ranked, NULL = not a college (professional bodies, NDA)
  fee    the offering's fee source, else the college's; with neither, the median of the sourced fees of the
         colleges in the same fee group, marked estimated and saying so in the source
Standard library only.
"""

import csv
import re
import sys
import uuid
from pathlib import Path
from statistics import median

DB = Path(__file__).resolve().parent.parent
DATA = DB / "data"
SEED = DB / "seed" / "02_careers_courses.sql"

STREAMS = ("science_pcm", "science_pcb", "science_pcmb", "commerce_maths", "commerce", "arts")
ALIASES = {
    "SCI_M": ("science_pcm", "science_pcmb"),
    "SCI_B": ("science_pcb", "science_pcmb"),
    "SCI_ANY": ("science_pcm", "science_pcb", "science_pcmb"),
    "MATHS": ("science_pcm", "science_pcmb", "commerce_maths"),
    "ALL": STREAMS,
}
SMALL_NIRF_CATEGORIES = {"Medical", "Dental", "Law", "Architecture"}  # NIRF ranks only ~40-50 here
NOT_COLLEGES = {"professional_body", "nda"}
NIRF_YEAR = 2025
MIN_COLLEGES = 200
MIN_PROGRAMS = 20
CAREER_NAMESPACE = uuid.UUID("6f1e7c52-4d43-4f0a-9d3b-7c1a2e5f8b90")

GROUP_LABELS = {
    "iit": "IIT", "nit": "NIT", "national_institute": "national institute (IIIT, IIEST, SPA, ...)",
    "iiser": "IISER", "private_univ": "private / deemed engineering university",
    "state_univ_engg": "state government engineering college", "private_engg_college": "private engineering college",
    "aiims": "AIIMS", "govt_medical": "government medical college", "private_medical": "private medical college",
    "deemed_medical": "deemed-university medical college", "govt_dental": "government dental college",
    "private_dental": "private dental college", "ayush": "AYUSH college", "pharmacy": "pharmacy college",
    "nursing": "nursing college", "physio": "physiotherapy college", "vet": "veterinary college",
    "agri": "agricultural university", "science_national": "national science institute",
    "public_college": "public / aided college", "private_univ_general": "private university",
    "ipm": "IIM integrated programme", "professional_body": "professional body", "hotel": "hotel management institute",
    "design_national": "national design institute", "nlu": "national law university", "nda": "NDA",
}

DOMAINS = """-- ---------- domains ----------
INSERT INTO domains (id, name, description) VALUES
    ('d0000000-0000-4000-8000-000000000001', 'Engineering / Technology', 'Software, data, electronics and core engineering.'),
    ('d0000000-0000-4000-8000-000000000002', 'Sciences / Research', 'Pure and applied sciences, research and biotechnology.'),
    ('d0000000-0000-4000-8000-000000000003', 'Business / Management', 'Commerce, finance, management and entrepreneurship.'),
    ('d0000000-0000-4000-8000-000000000004', 'Medicine / Healthcare', 'Medicine, nursing, pharmacy and allied health.'),
    ('d0000000-0000-4000-8000-000000000005', 'Arts / Design / Media', 'Design, architecture, fine arts and media.'),
    ('d0000000-0000-4000-8000-000000000006', 'Law / Civil Services', 'Law, public policy and government services.'),
    ('d0000000-0000-4000-8000-000000000007', 'Education / Teaching', 'Teaching, training and educational research.'),
    ('d0000000-0000-4000-8000-000000000008', 'Defence / Sports', 'Armed forces, sports and physical education.')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;
"""


class CatalogError(Exception):
    pass


def read(name: str) -> list[dict[str, str]]:
    with open(DATA / name, encoding="utf-8", newline="") as f:
        return [{k: (v or "").strip() for k, v in row.items()} for row in csv.DictReader(f)]


def states() -> set[str]:
    """The indian_state values, read from the region_name domain in db/schema.sql."""
    schema = (DB / "schema.sql").read_text(encoding="utf-8")
    block = re.search(r"CREATE DOMAIN public\.region_name.*?;", schema, re.S)
    if not block:
        raise CatalogError("region_name domain not found in db/schema.sql")
    return set(re.findall(r"'([^']+)'::text", block.group(0))) - {"India"}


def stream_list(spec: str, where: str) -> list[str]:
    out: list[str] = []
    for token in spec.split(";"):
        for stream in ALIASES.get(token, (token,)):
            if stream not in STREAMS:
                raise CatalogError(f"{where}: unknown stream {stream!r}")
            if stream not in out:
                out.append(stream)
    if not out:
        raise CatalogError(f"{where}: no streams")
    return [s for s in STREAMS if s in out]


def parse_nirf(nirf: str) -> tuple[str, int | None, str] | None:
    """'Engineering 12' -> ('Engineering', 12, '12'); 'Engineering 101-150' -> ('Engineering', 101, '101-150')."""
    if not nirf:
        return None
    match = re.fullmatch(r"([A-Za-z]+) (\d+)(?:-(\d+))?", nirf)
    if not match:
        raise CatalogError(f"bad NIRF value {nirf!r}")
    category, low, high = match.groups()
    return category, int(low), f"{low}-{high}" if high else low


def tier(nirf: tuple[str, int | None, str] | None, ini: bool, group: str) -> int | None:
    if group in NOT_COLLEGES:
        return None
    if nirf:
        category, rank, label = nirf
        limit = 20 if category in SMALL_NIRF_CATEGORIES else 50
        return 1 if "-" not in label and rank <= limit else 2
    return 2 if ini else 3


def sql(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        return "'{" + ",".join(value) + "}'"
    return "'" + str(value).replace("'", "''") + "'"


def build() -> tuple[str, dict]:
    programs = {p["key"]: p for p in read("programs.csv")}
    careers = read("careers.csv")
    colleges = read("colleges.csv")
    fees = {f["ref"]: f for f in read("fees.csv")}
    valid_states = states()

    if len(programs) < MIN_PROGRAMS:
        raise CatalogError(f"only {len(programs)} programmes; need at least {MIN_PROGRAMS}")
    for key, p in programs.items():
        p["eligible"] = stream_list(p["eligible_streams"], f"programme {key} eligible_streams")
        p["primary"] = stream_list(p["primary_streams"], f"programme {key} primary_streams")
        if not set(p["primary"]) <= set(p["eligible"]):
            raise CatalogError(f"programme {key}: primary streams must be a subset of eligible streams")
        if p["level"] not in ("UG", "PG") or float(p["duration_years"]) <= 0:
            raise CatalogError(f"programme {key}: bad level or duration")
        if not p["eligibility_source"]:
            raise CatalogError(f"programme {key}: eligibility needs a source")

    # fee sources
    for ref, f in fees.items():
        f["fee"] = int(f["annual_fee"])
        f["is_estimated"] = {"true": True, "false": False}[f["estimated"]]
        if f["fee"] < 0 or not f["source"]:
            raise CatalogError(f"fee {ref}: needs a non-negative fee and a source")
        if not f["is_estimated"] and not (f["url"] and f["as_of"]):
            raise CatalogError(f"fee {ref}: a sourced fee needs a URL and a date (or mark it estimated)")

    # colleges and what they offer
    offers: dict[str, list[dict]] = {key: [] for key in programs}
    group_fees: dict[str, list[int]] = {}
    seen_names: set[str] = set()
    for c in colleges:
        where = f"college {c['key']}"
        if c["name"] in seen_names:
            raise CatalogError(f"{where}: duplicate college name {c['name']!r}")
        seen_names.add(c["name"])
        if c["state"] not in valid_states:
            raise CatalogError(f"{where}: unknown state {c['state']!r}")
        if c["fee_group"] not in GROUP_LABELS:
            raise CatalogError(f"{where}: unknown fee group {c['fee_group']!r}")
        if c["fee_ref"] and c["fee_ref"] not in fees:
            raise CatalogError(f"{where}: unknown fee source {c['fee_ref']!r}")
        c["nirf_parsed"] = parse_nirf(c["nirf"])
        c["tier"] = tier(c["nirf_parsed"], c["ini"] == "y", c["fee_group"])
        if c["fee_ref"]:
            group_fees.setdefault(c["fee_group"], []).append(fees[c["fee_ref"]]["fee"])
        for item in c["programs"].split(";"):
            match = re.fullmatch(r"([a-z_]+)(?:@([^=]+))?(?:=([a-z_]+))?", item)
            if not match:
                raise CatalogError(f"{where}: bad programme entry {item!r}")
            key, exam, ref = match.groups()
            if key not in programs:
                raise CatalogError(f"{where}: unknown programme {key!r}")
            if ref and ref not in fees:
                raise CatalogError(f"{where}: unknown fee source {ref!r}")
            offers[key].append({"college": c, "exam": (exam or c["exam"]).strip(), "ref": ref or c["fee_ref"]})

    missing = [key for key, rows in offers.items() if not rows]
    if missing:
        raise CatalogError(f"no college offers: {', '.join(missing)}")
    if len(colleges) < MIN_COLLEGES:
        raise CatalogError(f"only {len(colleges)} colleges; need at least {MIN_COLLEGES}")

    def fee_for(offer: dict) -> dict:
        if offer["ref"]:
            f = fees[offer["ref"]]
            return {"fee": f["fee"], "estimated": f["is_estimated"], "source": f["source"],
                    "url": f["url"] or None, "as_of": f["as_of"] or None}
        group = offer["college"]["fee_group"]
        values = group_fees.get(group)
        if not values:
            raise CatalogError(f"college {offer['college']['key']}: no fee and no sourced fee in group {group!r}")
        label = GROUP_LABELS[group]
        return {
            "fee": round(median(values)),
            "estimated": True,
            "source": (f"Estimated: median of {len(values)} sourced {label} fees "
                       f"(Rs {min(values):,} to Rs {max(values):,} a year); this college's own fee is not verified yet"),
            "url": None,
            "as_of": None,
        }

    # careers, courses, routes
    career_rows, course_rows, route_rows = [], [], []
    seen_careers: set[str] = set()
    for career in careers:
        name = career["name"]
        if name in seen_careers:
            raise CatalogError(f"duplicate career {name!r}")
        seen_careers.add(name)
        if not re.fullmatch(r"[1-8]", career["domain"]):
            raise CatalogError(f"career {name}: domain must be 1-8")
        if not re.fullmatch(r"\d{2}-\d{4}\.\d{2}", career["onet"]):
            raise CatalogError(f"career {name}: bad O*NET code {career['onet']!r}")
        career_id = career["id"] or str(uuid.uuid5(CAREER_NAMESPACE, name))
        domain_id = f"d0000000-0000-4000-8000-00000000000{career['domain']}"
        career_rows.append((career_id, name, domain_id, career["education_path"]))
        keys = career["programs"].split(";")
        if not keys or any(k not in programs for k in keys):
            raise CatalogError(f"career {name}: unknown programme in {career['programs']!r}")
        for key in keys:
            p = programs[key]
            course_rows.append((name, p["name"], p["level"], float(p["duration_years"]), p["eligible"], p["primary"]))
            for offer in offers[key]:
                c, fee = offer["college"], fee_for(offer)
                nirf = c["nirf_parsed"]
                rank_source = None
                if nirf:
                    category, _, label = nirf
                    rank_source = f"NIRF {NIRF_YEAR} {category}" + (f", band {label}" if "-" in label else "")
                route_rows.append((
                    name, p["name"], offer["exam"], c["name"], c["city"], c["state"],
                    fee["fee"], int(c["living"]) if c["living"] else None,
                    nirf[1] if nirf else None, rank_source, c["tier"],
                    fee["source"], fee["url"], fee["as_of"], fee["estimated"],
                ))

    stats = {
        "careers": len(career_rows),
        "programmes": len(programs),
        "colleges": len(colleges),
        "courses": len(course_rows),
        "routes": len(route_rows),
        "routes_sourced": sum(1 for r in route_rows if not r[14]),
        "colleges_by_tier": {t: sum(1 for c in colleges if c["tier"] == t) for t in (1, 2, 3, None)},
        "colleges_with_own_fee": sum(1 for c in colleges if c["fee_ref"]),
    }
    return render(career_rows, course_rows, route_rows, stats), stats


def render(career_rows: list, course_rows: list, route_rows: list, stats: dict) -> str:
    out = [
        "-- =============================================================================",
        "-- Seed 02: domains, careers, courses and the exam + college routes into each course.",
        "-- GENERATED by db/scripts/build_catalog.py from db/data/*.csv. Do not edit; change the CSV files and run",
        "--   python db/scripts/build_catalog.py --write",
        f"-- {stats['careers']} careers, {stats['programmes']} programmes, {stats['colleges']} colleges, "
        f"{stats['routes']} routes ({stats['routes_sourced']} with a sourced fee; the rest are marked estimated).",
        "-- Re-running updates every row and removes rows the catalog no longer has.",
        "-- =============================================================================",
        "",
        DOMAINS,
        "-- ---------- careers ----------",
        "INSERT INTO careers (id, name, domain_id, education_path) VALUES",
        ",\n".join(f"    ({sql(i)}, {sql(n)}, {sql(d)}, {sql(e)})" for i, n, d, e in career_rows),
        "ON CONFLICT (id) DO UPDATE SET",
        "    name           = EXCLUDED.name,",
        "    domain_id      = EXCLUDED.domain_id,",
        "    education_path = EXCLUDED.education_path;",
        "",
        "-- ---------- courses: one per career and programme; streams per the programme's regulator ----------",
        "INSERT INTO courses (career_id, name, level, duration_years, eligible_streams, primary_streams)",
        "SELECT c.id, v.course, v.level, v.duration_years, CAST(v.eligible AS school_stream[]), CAST(v.primary_ AS school_stream[])",
        "FROM (VALUES",
        ",\n".join(
            f"    ({sql(car)}, {sql(name)}, {sql(level)}, {duration}, {sql(el)}, {sql(pr)})"
            for car, name, level, duration, el, pr in course_rows
        ),
        ") AS v(career, course, level, duration_years, eligible, primary_)",
        "JOIN careers c ON c.name = v.career",
        "ON CONFLICT (career_id, name) DO UPDATE SET",
        "    level            = EXCLUDED.level,",
        "    duration_years   = EXCLUDED.duration_years,",
        "    eligible_streams = EXCLUDED.eligible_streams,",
        "    primary_streams  = EXCLUDED.primary_streams;",
        "",
        "-- Courses the catalog no longer has (their routes go with them: ON DELETE CASCADE).",
        "DELETE FROM courses co USING careers c",
        "WHERE c.id = co.career_id AND (c.name, co.name) NOT IN (VALUES",
        ",\n".join(f"    ({sql(car)}, {sql(name)})" for car, name, *_ in course_rows),
        ");",
        "",
        "-- ---------- exam + college routes ----------",
        "-- One statement: upsert every route, then delete the routes it didn't touch (no longer in the catalog).",
        "WITH kept AS (",
        "INSERT INTO exams_colleges",
        "    (course_id, exam, college, city, state, annual_fee, annual_living_cost, rank, rank_source, tier,",
        "     source, source_url, as_of, estimated)",
        "SELECT co.id, v.exam, v.college, v.city, v.state, v.annual_fee, v.living, v.rank, v.rank_source, v.tier,",
        "       v.source, v.url, CAST(v.as_of AS date), v.estimated",
        "FROM (VALUES",
        ",\n".join(
            "    (" + ", ".join(sql(x) for x in row[:8]) + f", CAST({sql(row[8])} AS integer), {sql(row[9])}, "
            f"CAST({sql(row[10])} AS smallint), " + ", ".join(sql(x) for x in row[11:]) + ")"
            for row in route_rows
        ),
        ") AS v(career, course, exam, college, city, state, annual_fee, living, rank, rank_source, tier,",
        "       source, url, as_of, estimated)",
        "JOIN careers c ON c.name = v.career",
        "JOIN courses co ON co.career_id = c.id AND co.name = v.course",
        "ON CONFLICT (course_id, college, exam) DO UPDATE SET",
        "    city               = EXCLUDED.city,",
        "    state              = EXCLUDED.state,",
        "    annual_fee         = EXCLUDED.annual_fee,",
        "    annual_living_cost = EXCLUDED.annual_living_cost,",
        "    rank               = EXCLUDED.rank,",
        "    rank_source        = EXCLUDED.rank_source,",
        "    tier               = EXCLUDED.tier,",
        "    source             = EXCLUDED.source,",
        "    source_url         = EXCLUDED.source_url,",
        "    as_of              = EXCLUDED.as_of,",
        "    estimated          = EXCLUDED.estimated",
        "RETURNING id",
        ")",
        "DELETE FROM exams_colleges WHERE id NOT IN (SELECT id FROM kept);",
        "",
    ]
    return "\n".join(out)


def main() -> int:
    try:
        text, stats = build()
    except CatalogError as e:
        print(f"catalog error: {e}", file=sys.stderr)
        return 1
    tiers = stats["colleges_by_tier"]
    print(
        f"{stats['careers']} careers, {stats['programmes']} programmes, {stats['colleges']} colleges "
        f"(tier 1: {tiers[1]}, tier 2: {tiers[2]}, tier 3: {tiers[3]}, not a college: {tiers[None]}; "
        f"{stats['colleges_with_own_fee']} with their own fee source), {stats['courses']} courses, "
        f"{stats['routes']} routes ({stats['routes_sourced']} sourced fees)"
    )
    if "--write" in sys.argv:
        SEED.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {SEED.relative_to(DB.parent)}")
        return 0
    current = SEED.read_text(encoding="utf-8") if SEED.exists() else ""
    if current != text:
        print(f"{SEED.relative_to(DB.parent)} is out of date: run with --write", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
