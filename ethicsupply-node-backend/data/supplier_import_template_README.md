# Supplier Import Template - Field Guide

This document describes all fields available in the supplier import CSV template.

## Required Fields

These fields are **mandatory** and must be provided:

- **name** (String): Supplier/company name
- **country** (String): Country where supplier operates (e.g., "United States", "Germany", "India")

## Optional Fields

All other fields are optional. If not provided, default values will be used.

---

## Field Descriptions

### Basic Information

| Field | Type | Range/Format | Description | Default |
|-------|------|--------------|-------------|---------|
| `name` | String | - | Supplier/company name (REQUIRED) | - |
| `country` | String | - | Country name (REQUIRED) | - |
| `industry` | String | - | Industry sector (e.g., "Technology", "Manufacturing", "Textiles & Apparel") | - |

### Financial Metrics

| Field | Type | Range | Description | Default |
|-------|------|-------|-------------|---------|
| `revenue` | Number | ≥ 0 | Revenue in millions of USD (legacy field) | 0 |
| `revenue_musd` | Number | ≥ 0 | Revenue in millions of USD (for margin calculation) | null |
| `cost_musd` | Number | ≥ 0 | Cost in millions of USD (for margin calculation) | null |
| `margin_pct` | Number | 0-100 | Explicit margin percentage. If not provided, will be calculated from revenue_musd and cost_musd | null (auto-calculated) |
| `employee_count` | Number | ≥ 0 | Total number of employees | 0 |

### Environmental Metrics

| Field | Type | Range | Description | Default |
|-------|------|-------|-------------|---------|
| `co2_emissions` | Number | ≥ 0 | CO₂ emissions in tons | 0 |
| `total_emissions` | Number | ≥ 0 | Total emissions (Scope 1+2) in tCO₂e | 0 |
| `water_usage` | Number | ≥ 0 | Water usage in cubic meters (m³) | 50 |
| `waste_generated` | Number | ≥ 0 | Waste generated in tonnes | 0 |
| `renewable_energy_percent` | Number | 0-100 | Percentage of energy from renewable sources | 0 |
| `energy_efficiency` | Number | 0-1 | Energy efficiency score (0 = poor, 1 = excellent) | 0.5 |
| `waste_management_score` | Number | 0-1 | Waste management score (0 = poor, 1 = excellent) | 0 |
| `pollution_control` | Number | 0-1 | Pollution control score (0 = poor, 1 = excellent) | 0.5 |

### Social Metrics

| Field | Type | Range | Description | Default |
|-------|------|-------|-------------|---------|
| `injury_rate` | Number | ≥ 0 | Injury rate per 200,000 hours worked | 0 |
| `training_hours` | Number | ≥ 0 | Average training hours per employee per year | 0 |
| `living_wage_ratio` | Number | ≥ 0 | Ratio of wages to living wage (1.0 = meets living wage) | 1 |
| `gender_diversity_percent` | Number | 0-100 | Percentage of women in workforce | 0 |
| `wage_fairness` | Number | 0-1 | Wage fairness score (0 = poor, 1 = excellent) | 0 |
| `human_rights_index` | Number | 0-1 | Human rights compliance index (0 = poor, 1 = excellent) | 0 |
| `community_engagement` | Number | 0-1 | Community engagement score (0 = poor, 1 = excellent) | 0.5 |
| `worker_safety` | Number | 0-1 | Worker safety score (0 = poor, 1 = excellent) | 0.5 |
| `diversity_inclusion_score` | Number | 0-1 | Diversity and inclusion score (0 = poor, 1 = excellent) | 0.5 |

### Governance Metrics

| Field | Type | Range | Description | Default |
|-------|------|-------|-------------|---------|
| `board_diversity` | Number | 0-100 | Percentage of board seats held by women/minorities | 0.5 |
| `board_independence` | Number | 0-100 | Percentage of independent directors on board | 0.5 |
| `transparency_score` | Number | 0-100 | Transparency and disclosure score (0 = poor, 100 = excellent) | 0.5 |
| `anti_corruption_policy` | Boolean | true/false | Whether anti-corruption policy is in place | false |
| `ethics_program` | Number | 0-1 | Ethics program strength (0 = poor, 1 = excellent) | 0.5 |
| `compliance_systems` | Number | 0-1 | Compliance systems score (0 = poor, 1 = excellent) | 0.5 |
| `corruption_risk` | Number | 0-1 | Corruption risk level (0 = low risk, 1 = high risk) | 0.5 |

### Supply Chain Metrics

| Field | Type | Range | Description | Default |
|-------|------|-------|-------------|---------|
| `delivery_efficiency` | Number | 0-1 | Delivery efficiency score (0 = poor, 1 = excellent) | 0 |
| `quality_control_score` | Number | 0-1 | Quality control score (0 = poor, 1 = excellent) | 0.5 |
| `supplier_diversity` | Number | 0-1 | Supplier diversity score (0 = poor, 1 = excellent) | 0.5 |
| `traceability` | Number | 0-1 | Supply chain traceability score (0 = poor, 1 = excellent) | 0.5 |

### Risk Factors

| Field | Type | Range | Description | Default |
|-------|------|-------|-------------|---------|
| `geopolitical_risk` | Number | 0-1 | Geopolitical risk level (0 = low risk, 1 = high risk) | 0.5 |
| `climate_risk` | Number | 0-1 | Climate risk level (0 = low risk, 1 = high risk) | 0.5 |
| `labor_dispute_risk` | Number | 0-1 | Labor dispute risk level (0 = low risk, 1 = high risk) | 0.5 |

---

## Usage Notes

### Margin Calculation

If `margin_pct` is not provided, it will be automatically calculated from `revenue_musd` and `cost_musd`:
```
margin_pct = ((revenue_musd - cost_musd) / revenue_musd) * 100
```

### Score Fields (0-1 range)

Many fields use a 0-1 scale where:
- **0** = Poor/None/Low
- **0.5** = Average/Moderate
- **1** = Excellent/High

### Score Fields (0-100 range)

Some fields use a 0-100 scale:
- **0** = Poor/None
- **50** = Average
- **100** = Excellent/Maximum

### Boolean Fields

For `anti_corruption_policy`:
- Use `true` or `false` (case-insensitive)
- Or `1` for true, `0` for false

### Empty Values

- Leave fields empty or use `null` if data is not available
- The system will use default values for missing fields
- Scores will be automatically calculated based on available data

---

## Example CSV Format

```csv
name,country,industry,revenue_musd,cost_musd,margin_pct,employee_count,total_emissions,water_usage,renewable_energy_percent,transparency_score,anti_corruption_policy
"Company A","United States","Technology",1000,800,20,5000,150000,40000,50,80,true
"Company B","Germany","Manufacturing",750,600,,3000,100000,30000,35,70,true
```

---

## Import Process

1. Download the template CSV file
2. Fill in the required fields (`name`, `country`)
3. Add optional fields as available
4. Save the file as CSV (UTF-8 encoding recommended)
5. Upload via the bulk import feature in the UI
6. The system will:
   - Validate required fields
   - Calculate missing scores
   - Derive margin_pct if revenue/cost provided
   - Generate ESG scores automatically

---

## Tips

- **Start with required fields only** - You can always update suppliers later with more data
- **Use consistent country names** - Use full country names (e.g., "United States" not "USA")
- **Industry names** - Use standard industry names for better categorization
- **Numeric values** - Use decimal numbers where appropriate (e.g., 45.5 for percentages)
- **Boolean values** - Use `true`/`false` or `1`/`0` for boolean fields

---

## Support

For questions or issues with the import template, please refer to the documentation or contact support.

