#!/usr/bin/env python3
"""
OptiSupply ESG Annual Report Generator
Produces a luxury editorial PDF (Monocle meets Bloomberg) via WeasyPrint + Jinja2.

Install dependencies:
    pip install weasyprint jinja2

Run:
    python generate_esg_report.py                        # uses built-in demo data
    python generate_esg_report.py --data data.json       # load from JSON file
    python generate_esg_report.py --out my_report.pdf    # custom output path
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    sys.exit("ERROR: jinja2 not found. Run: pip install weasyprint jinja2")

# WeasyPrint is only needed for PDF output (requires system Pango/GTK libs).
# HTML preview works without it.
_WEASYPRINT_AVAILABLE = False
try:
    from weasyprint import HTML, CSS  # type: ignore
    _WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    pass


# ─── Default report data ─────────────────────────────────────────────────────
DEFAULT_DATA = {
    "generated_date": datetime.now().strftime("%B %-d, %Y"),
    "year": datetime.now().year,
    "total_suppliers": 160,
    "countries_count": 47,
    "avg_esg_score": "40%",
    "avg_co2": "149,644.8t",
    "avg_risk_penalty": "109%",
    "avg_data_completeness": "98%",
    "pull_quote": (
        "Your supply chain shows strong governance fundamentals "
        "with clear opportunities in environmental performance."
    ),
    "intro_text": (
        "This report synthesises performance data across 160 suppliers spanning 47 countries. "
        "Our AI scoring engine evaluates Environmental, Social and Governance indicators in "
        "real time, applying geo-risk overlays and peer benchmarking to produce a single "
        "risk-adjusted ESG score per supplier. The findings below represent the state of "
        "your supply chain as of the report generation date."
    ),
    "risk_distribution": [
        {"label": "LOW",  "count": 102, "pct": 63.7, "color": "#2D6A4F", "text": "#AAFFCC"},
        {"label": "MED",  "count": 3,   "pct": 1.9,  "color": "#C9A227", "text": "#FFF3CC"},
        {"label": "HIGH", "count": 1,   "pct": 0.6,  "color": "#C0392B", "text": "#FFCCCC"},
        {"label": "CRIT", "count": 54,  "pct": 33.8, "color": "#7B0000", "text": "#FFAAAA"},
    ],
    "pillars": [
        {"name": "Environmental", "score": 55.6, "color": "#2D6A4F", "bg": "#1A3A2A"},
        {"name": "Social",        "score": 65.3, "color": "#1A4E8A", "bg": "#0F2040"},
        {"name": "Governance",    "score": 67.3, "color": "#7B2D8B", "bg": "#2A1040"},
    ],
    "countries": [
        {"name": "France",         "count": 25},
        {"name": "Germany",        "count": 20},
        {"name": "South Korea",    "count": 19},
        {"name": "United States",  "count": 17},
        {"name": "Singapore",      "count": 17},
        {"name": "China",          "count": 17},
        {"name": "Japan",          "count": 16},
        {"name": "India",          "count": 10},
        {"name": "Canada",         "count": 10},
        {"name": "United Kingdom", "count": 9},
    ],
    "ai_insights": [
        {
            "type": "Predicted Trend",
            "confidence": 87,
            "text": (
                "Overall ESG score predicted to improve by 12% next quarter, "
                "driven by social responsibility gains across European suppliers."
            ),
            "color": "#2D6A4F",
        },
        {
            "type": "Risk Factor",
            "confidence": 82,
            "text": (
                "3 suppliers identified with high potential for labor disputes "
                "in the next 6 months. Proactive engagement recommended."
            ),
            "color": "#C0392B",
        },
        {
            "type": "Opportunity",
            "confidence": 91,
            "text": (
                "Switching 15% of energy suppliers to renewables improves "
                "environmental score by 22% with minimal cost impact."
            ),
            "color": "#C8F05A",
        },
        {
            "type": "Anomaly Detected",
            "confidence": 78,
            "text": (
                "Unusual water usage patterns from 2 suppliers in Southeast Asia. "
                "Data verification and on-site audit recommended within 60 days."
            ),
            "color": "#C9A227",
        },
    ],
    "recommendations": [
        "Implement a supplier diversity program targeting under-represented geographies to improve social score by an estimated 8 points.",
        "Engage the top 10 carbon-emitting suppliers to set and commit to science-based emissions reduction targets by Q3.",
        "Develop water conservation incentives for water-intensive industries — textiles, food & beverage, chemicals.",
        "Enhance supply chain transparency through blockchain-based provenance tracking, starting with tier-1 suppliers.",
    ],
    "suppliers": [
        {
            "name": "Vertex Manufacturing Alliance",
            "country": "Germany",
            "esg": "0%",
            "composite": "72%",
            "risk": "critical",
            "disclosure": "100%",
        },
        {
            "name": "Ultra Construction Enterprises",
            "country": "France",
            "esg": "0%",
            "composite": "59%",
            "risk": "critical",
            "disclosure": "100%",
        },
        {
            "name": "Vertex Automotive Ventures",
            "country": "United Kingdom",
            "esg": "0%",
            "composite": "76%",
            "risk": "critical",
            "disclosure": "100%",
        },
        {
            "name": "Green Technology International",
            "country": "United States",
            "esg": "79%",
            "composite": "79%",
            "risk": "low",
            "disclosure": "100%",
        },
        {
            "name": "Next Electronics Solutions",
            "country": "South Korea",
            "esg": "55%",
            "composite": "55%",
            "risk": "low",
            "disclosure": "100%",
        },
        {
            "name": "Summit Chemicals Industries",
            "country": "France",
            "esg": "65%",
            "composite": "65%",
            "risk": "low",
            "disclosure": "92%",
        },
    ],
    "co2_by_industry": [
        {"industry": "Energy",        "value": 4220.45},
        {"industry": "Electronics",   "value": 3368.85},
        {"industry": "Chemicals",     "value": 2703.99},
        {"industry": "Manufacturing", "value": 2166.48},
        {"industry": "Automotive",    "value": 1869.20},
        {"industry": "Textiles",      "value": 1704.09},
        {"industry": "Food & Bev",    "value": 1701.25},
        {"industry": "Construction",  "value": 1235.26},
        {"industry": "Pharma",        "value":  929.03},
        {"industry": "Technology",    "value":  481.44},
    ],
}


def enrich_data(data: dict) -> dict:
    """Pre-compute derived values so the template stays clean."""

    # Max country count for bar width calc
    if data.get("countries"):
        max_count = max(c["count"] for c in data["countries"])
        for c in data["countries"]:
            c["bar_pct"] = round(c["count"] / max_count * 100, 1)

    # Max CO2 for bar width
    if data.get("co2_by_industry"):
        max_co2 = max(x["value"] for x in data["co2_by_industry"])
        for x in data["co2_by_industry"]:
            x["bar_pct"] = round(x["value"] / max_co2 * 100, 1)
            x["value_fmt"] = f"{x['value']:,.0f}"

    # Confidence badge color
    for ins in data.get("ai_insights", []):
        c = ins["confidence"]
        if c >= 90:
            ins["conf_bg"] = "rgba(200,240,90,0.15)"
            ins["conf_color"] = "#C8F05A"
        elif c >= 80:
            ins["conf_bg"] = "rgba(201,162,39,0.18)"
            ins["conf_color"] = "#C9A227"
        else:
            ins["conf_bg"] = "rgba(192,57,43,0.18)"
            ins["conf_color"] = "#C0392B"

    # Risk badge styles for supplier table
    risk_styles = {
        "critical": {"bg": "#7B0000", "color": "#FFAAAA"},
        "high":     {"bg": "#C0392B", "color": "#FFCCCC"},
        "medium":   {"bg": "#C9A227", "color": "#FFF3CC"},
        "low":      {"bg": "#2D6A4F", "color": "#AAFFCC"},
    }
    for s in data.get("suppliers", []):
        style = risk_styles.get(s["risk"].lower(), {"bg": "#444", "color": "#ccc"})
        s["risk_bg"] = style["bg"]
        s["risk_color"] = style["color"]
        s["esg_red"] = s.get("esg", "") == "0%"

    return data


def render_report(data: dict, template_path: Path) -> str:
    env = Environment(
        loader=FileSystemLoader(str(template_path.parent)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template(template_path.name)
    return template.render(**data)


def generate_pdf(html: str, output_path: str) -> None:
    if not _WEASYPRINT_AVAILABLE:
        sys.exit(
            "ERROR: WeasyPrint could not load system libraries (Pango/GObject).\n"
            "On macOS run:  brew install pango\n"
            "On Debian/Ubuntu run:  apt-get install libpango-1.0-0 libpangoft2-1.0-0\n"
            "Then re-run this script.\n\n"
            "TIP: Use --html-only to generate an HTML preview that works now."
        )
    base_url = str(Path(__file__).parent)
    HTML(string=html, base_url=base_url).write_pdf(output_path)
    print(f"✓ PDF written to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate OptiSupply ESG Report PDF")
    parser.add_argument("--data", help="Path to JSON data file", default=None)
    parser.add_argument(
        "--out",
        help="Output PDF path",
        default=str(Path(__file__).parent / f"ESG_Report_{datetime.now().year}.pdf"),
    )
    parser.add_argument(
        "--html-only",
        action="store_true",
        help="Write HTML preview only (no PDF)",
    )
    args = parser.parse_args()

    # Load data
    if args.data:
        with open(args.data, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"✓ Loaded data from: {args.data}")
    else:
        data = dict(DEFAULT_DATA)
        print("✓ Using built-in demo data")

    data = enrich_data(data)

    # Render HTML
    template_path = Path(__file__).parent / "esg_report_template.html"
    if not template_path.exists():
        sys.exit(f"ERROR: Template not found at {template_path}")

    print("✓ Rendering HTML template…")
    html = render_report(data, template_path)

    if args.html_only:
        preview_path = str(Path(args.out).with_suffix(".html"))
        with open(preview_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"✓ HTML preview written to: {preview_path}")
        return

    print("✓ Generating PDF (this may take 10–30s)…")
    generate_pdf(html, args.out)


if __name__ == "__main__":
    main()
