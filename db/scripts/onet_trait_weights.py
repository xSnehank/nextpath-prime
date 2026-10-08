"""Builds db/seed/03_trait_weights.sql from the O*NET 31.0 database, so the career weights are reproducible.

    python db/scripts/onet_trait_weights.py <folder with O*NET 31.0 CSV files> > db/seed/03_trait_weights.sql

The careers and their O*NET codes come from db/data/careers.csv.

Needs abilities.csv, career_interest_types.csv, work_styles.csv and occupation_data.csv from
https://www.onetcenter.org/database.html (CSV). O*NET is by the U.S. Department of Labor, Employment and Training
Administration, under CC BY 4.0. Standard library only.

Method, per career and per group (aptitude, interest, cognitive):
1. Each of our dimensions is the mean rating of the O*NET elements mapped to it (DIMENSIONS below).
2. A career's weight on a dimension is how far its rating is ABOVE the average across all O*NET occupations,
   so the weights show what makes this career different, not what every job needs.
3. The weights in each group are scaled to sum to 1 and rounded to 2 decimals (the largest absorbs the
   rounding). If no dimension is above average, the plain ratings are used instead.
"""

import csv
import sys
from collections import defaultdict
from pathlib import Path
from statistics import fmean

# Our dimension -> (O*NET file, scale, element ids)
DIMENSIONS: dict[str, dict[str, tuple[str, str, tuple[str, ...]]]] = {
    "aptitude": {
        "logical": ("abilities.csv", "IM", ("1.A.1.b.5", "1.A.1.b.6", "1.A.1.b.7")),  # deductive, inductive, ordering
        "numerical": ("abilities.csv", "IM", ("1.A.1.c.1", "1.A.1.c.2")),  # mathematical reasoning, number facility
        "verbal": ("abilities.csv", "IM", ("1.A.1.a.1", "1.A.1.a.2", "1.A.1.a.3", "1.A.1.a.4")),  # comprehension, expression
        "spatial": ("abilities.csv", "IM", ("1.A.1.e.1", "1.A.1.e.2")),  # spatial orientation, visualization
        "creative": ("abilities.csv", "IM", ("1.A.1.b.1", "1.A.1.b.2")),  # fluency of ideas, originality
    },
    "interest": {
        "realistic": ("career_interest_types.csv", "OI", ("1.B.1.a",)),
        "investigative": ("career_interest_types.csv", "OI", ("1.B.1.b",)),
        "artistic": ("career_interest_types.csv", "OI", ("1.B.1.c",)),
        "social": ("career_interest_types.csv", "OI", ("1.B.1.d",)),
        "enterprising": ("career_interest_types.csv", "OI", ("1.B.1.e",)),
        "conventional": ("career_interest_types.csv", "OI", ("1.B.1.f",)),
    },
    "cognitive": {
        "analytical": ("work_styles.csv", "WI", ("1.D.1.c",)),  # intellectual curiosity
        "structured": ("work_styles.csv", "WI", ("1.D.3.a", "1.D.3.b", "1.D.3.c")),  # cautiousness, detail, dependability
    },
}

# Our career -> the O*NET occupation used for it: the onet column of db/data/careers.csv.
CAREERS_CSV = Path(__file__).resolve().parent.parent / "data" / "careers.csv"

# Why a career uses an occupation that isn't its obvious match (printed above its line).
NOTES: dict[str, str] = {
    "Investment Banker": "Financial and Investment Analysts (13-2051.00) has no ability ratings in O*NET 31.0; "
    "this is the closest finance occupation that has all three.",
    "Financial Analyst": "Financial and Investment Analysts (13-2051.00) has no ability ratings in O*NET 31.0; "
    "Credit Analysts is the closest analytical finance occupation that has all three.",
    "Armed Forces Officer (NDA)": "O*NET has no ratings for military officers; police and detective supervisors are "
    "the closest civilian occupation for a disciplined, command-and-field role.",
    "AYUSH Doctor (BAMS)": "O*NET has no Ayurveda occupation; Naturopathic Physicians is the closest "
    "traditional-medicine practitioner.",
    "Instrumentation & Control Engineer": "O*NET has no instrumentation engineer; Mechatronics Engineers covers "
    "control and automation systems.",
}


def careers() -> dict[str, str]:
    with open(CAREERS_CSV, encoding="utf-8", newline="") as handle:
        return {row["name"]: row["onet"] for row in csv.DictReader(handle)}


def read_ratings(folder: Path) -> dict[tuple[str, str, str], dict[str, float]]:
    """(file, scale, element id) -> {occupation code: rating}, skipping ratings O*NET recommends suppressing."""
    ratings: dict[tuple[str, str, str], dict[str, float]] = defaultdict(dict)
    for file in {spec[0] for group in DIMENSIONS.values() for spec in group.values()}:
        with open(folder / file, encoding="utf-8", newline="") as handle:
            for row in csv.DictReader(handle):
                if row.get("Recommend Suppress") == "Y" or not row.get("Element ID"):
                    continue
                ratings[(file, row["Scale ID"], row["Element ID"])][row["O*NET-SOC Code"]] = float(row["Data Value"])
    return ratings


def dimension_value(ratings: dict, spec: tuple[str, str, tuple[str, ...]], code: str) -> float | None:
    file, scale, elements = spec
    values = [ratings[(file, scale, element)][code] for element in elements if code in ratings[(file, scale, element)]]
    return fmean(values) if len(values) == len(elements) else None


def round_to_one(raw: dict[str, float]) -> dict[str, float]:
    total = sum(raw.values())
    weights = {key: round(value / total, 2) for key, value in raw.items()}
    weights = {key: value for key, value in weights.items() if value > 0}
    largest = max(weights, key=weights.get)
    weights[largest] = round(weights[largest] + 1 - sum(weights.values()), 2)
    return dict(sorted(weights.items(), key=lambda item: -item[1]))


def career_weights(ratings: dict, code: str) -> dict[str, dict[str, float]]:
    result = {}
    for group, dimensions in DIMENSIONS.items():
        values = {dimension: dimension_value(ratings, spec, code) for dimension, spec in dimensions.items()}
        if None in values.values():
            raise SystemExit(f"{code} is missing O*NET ratings for {group}")
        averages = {
            dimension: fmean(
                v for c in {occ for element in spec[2] for occ in ratings[(spec[0], spec[1], element)]}
                if (v := dimension_value(ratings, spec, c)) is not None
            )
            for dimension, spec in dimensions.items()
        }
        above = {dimension: max(0.0, values[dimension] - averages[dimension]) for dimension in dimensions}
        result[group] = round_to_one(above if sum(above.values()) > 0 else values)
    return result


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    ratings = read_ratings(folder)
    titles = {}
    with open(folder / "occupation_data.csv", encoding="utf-8", newline="") as handle:
        titles = {row["O*NET-SOC Code"]: row["Title"] for row in csv.DictReader(handle)}

    import json

    print("-- =============================================================================")
    print("-- Seed 03: each career's trait weights, GENERATED by db/scripts/onet_trait_weights.py. Do not edit;")
    print("-- change the onet column in db/data/careers.csv and regenerate.")
    print("--")
    print("-- Source: O*NET 31.0 Database, U.S. Department of Labor, Employment and Training Administration")
    print("-- (https://www.onetcenter.org/database.html), CC BY 4.0. Abilities (importance), Career Interest Types")
    print("-- (occupational interests) and Work Styles (impact), weighted by how far each career is above the")
    print("-- average occupation. The O*NET occupation used for each career is noted on its line.")
    print("-- =============================================================================")
    print()
    for career, code in careers().items():
        weights = json.dumps(career_weights(ratings, code))
        if career in NOTES:
            print(f"-- {NOTES[career]}")
        print(f"-- {career}: O*NET {code} {titles.get(code, '')}")
        print(
            f"UPDATE careers SET trait_weights = '{weights}' WHERE name = '{career.replace(chr(39), chr(39) * 2)}';"
        )


if __name__ == "__main__":
    main()
