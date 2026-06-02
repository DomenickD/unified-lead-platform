# Unified Lead Platform Pricing Estimate

Prepared for the initial build, API/data costs, and continuous monthly maintenance of the proposed unified lead platform.

## Scope Basis

This estimate is based on `scope.md` and the current app structure in this repository. The proposed application combines:

- Real estate opportunities
- Construction and development opportunities
- Funding opportunities
- Residential and commercial lead categories
- City, state, and federal opportunity sources
- Search, filtering, dashboard, map view, lead management, funding portal, and settings workflows
- A single platform that can be resold outside Florida while maintaining Florida exclusivity

The current code references these live or proposed data sources:

- Grants.gov API for federal grant and funding opportunities
- Socrata open data APIs for Tampa and Hillsborough construction/permit feeds
- Bright Data Scraping Browser for protected permit portals such as Accela, if open data is incomplete
- A map/geocoding provider if the final app requires geocoded addresses, interactive maps, or Google-style map views

## Key Assumptions

- This is an MVP production build, not a fully custom enterprise CRM.
- Pricing assumes one web application with a React frontend, FastAPI backend, database, authentication, admin settings, data ingestion jobs, and deployment.
- Pricing does not include paid API/vendor overages, hosting, legal review, data licensing fees, or customer-side business operations.
- Public APIs may change, rate-limit, block, or remove fields. Any source instability is a customer/vendor dependency, not a developer defect.
- API costs below are estimates based on the listed public pricing pages as of June 2, 2026.
- Bright Data usage is estimated at `0.5 GB` per protected browser scrape run. Actual usage can be higher if target sites are slow, blocked, paginated heavily, or require retries.
- Google Maps pricing is included as an optional map/geocoding cost. If the app uses only stored latitude/longitude from public datasets and an open map tile provider, this cost may be reduced or avoided.

## Initial Build Estimate

| Work Item | Estimated Cost |
|---|---:|
| Discovery, workflow definition, data-source review, technical planning | $1,500 |
| UX/UI implementation for dashboard, lead management, discovery, funding portal, map view, settings | $6,000 |
| Backend API implementation with FastAPI routes, schemas, validation, background pull jobs | $6,500 |
| Database design and persistence replacing current in-memory stores | $3,500 |
| Data integrations for Grants.gov, Socrata permit feeds, and normalized opportunity models | $4,500 |
| Bright Data / protected-source scraping integration and retry/error handling | $3,500 |
| Authentication, roles, customer-ready access controls | $3,000 |
| Search, filtering, sorting, status workflows, export-ready lead organization | $3,500 |
| Deployment setup, environment variables, production configuration, basic monitoring | $2,500 |
| QA, bug fixing, launch support, documentation | $3,000 |
| Project management and client review cycles | $2,000 |
| **Estimated Initial Build Total** | **$39,500** |

## Required Upfront Payment

If the customer wants to start this app, **50% is due upfront before development begins**.

| Payment Milestone | Amount |
|---|---:|
| 50% upfront deposit | $19,750 |
| Remaining balance due before production handoff / launch | $19,750 |
| **Total initial build** | **$39,500** |

The upfront payment covers developer time, planning, implementation, testing, and setup work. It does not cover customer-owned API accounts, paid vendor overages, hosting bills, legal review, or third-party data licensing unless explicitly added to the contract.

## Proposed API And Data Vendor Costs

| Vendor / API | Purpose | Pricing Basis | Estimated Monthly Cost |
|---|---|---:|---:|
| Grants.gov API | Federal grant and funding opportunity search | Public `search2` and `fetchOpportunity` endpoints do not require authentication | $0 |
| Socrata / Tyler Data & Insights | Tampa and Hillsborough open data permit feeds | App tokens support API read operations; open data read access is generally free, subject to throttling | $0 |
| Bright Data Scraping Browser | Protected permit portal scraping where open APIs are incomplete | Public pricing page lists Scraping Browser at `$6 / GB` | Variable |
| Google Maps Platform Starter | Optional interactive maps and geocoding | Starter subscription is `$100/month` for `50,000 monthly calls` covering Dynamic Maps and Geocoding | $100/month |

## API Pull Cost Breakdown

This table estimates the monthly cost the customer would pay based on how often the app pulls external data.

Assumption: each scheduled pull includes one Grants.gov pull, two Socrata open-data pulls, and one optional Bright Data protected scrape. Grants.gov and Socrata are estimated at `$0`. Bright Data is estimated at `0.5 GB x $6/GB = $3.00` per protected scrape.

| Pull Frequency | Pulls Per Month | Grants.gov | Socrata Open Data | Bright Data Estimate | Source Pull Cost / Month |
|---|---:|---:|---:|---:|---:|
| Monthly pull | 1 | $0 | $0 | $3.00 | **$3.00/month** |
| Weekly pull | 4.33 | $0 | $0 | $12.99 | **$12.99/month** |
| Daily pull | 30 | $0 | $0 | $90.00 | **$90.00/month** |

If Google Maps Platform is used, add the fixed estimated map/geocoding cost:

| Pull Frequency | Source Pull Cost / Month | Google Maps Starter | Estimated API Total / Month |
|---|---:|---:|---:|
| Monthly pull | $3.00 | $100.00 | **$103.00/month** |
| Weekly pull | $12.99 | $100.00 | **$112.99/month** |
| Daily pull | $90.00 | $100.00 | **$190.00/month** |

If Bright Data is not needed, the source pull cost can be close to `$0/month`, with only mapping/geocoding or hosting costs remaining.

## Monthly App Maintenance

Maintenance is separate from API/vendor pass-through costs.

| Plan | Monthly Cost | Includes |
|---|---:|---|
| Basic maintenance | $1,500/month | Uptime checks, dependency updates, minor bug fixes, API key rotation support, monthly data-source health check |
| Standard maintenance | $3,000/month | Basic plan plus monitoring review, small feature adjustments, monthly reporting, priority bug fixes, up to 10 support hours |
| Growth maintenance | $5,000/month | Standard plan plus new data-source tuning, scraper updates, performance work, admin/user support, up to 20 support hours |

Recommended plan after launch: **Standard maintenance at $3,000/month**, plus API/vendor costs.

## Estimated First Month Cost

| Scenario | Upfront Build Deposit | First Month Maintenance | Estimated API Total | First Month Total |
|---|---:|---:|---:|---:|
| Monthly pulls with Google Maps | $19,750 | $3,000 | $103 | **$22,853** |
| Weekly pulls with Google Maps | $19,750 | $3,000 | $112.99 | **$22,862.99** |
| Daily pulls with Google Maps | $19,750 | $3,000 | $190 | **$22,940** |

## Customer Responsibilities And Blockers

The customer must provide or pay for the following before they can block development:

- Final approval of the exact data sources, states, counties, cities, and opportunity categories.
- API accounts, billing profiles, credentials, and vendor approvals for paid services such as Bright Data and Google Maps.
- Legal permission to collect, store, resell, or display third-party data, including any exclusive Florida resale language.
- Data licensing fees, if a public or private source requires a paid license.
- Hosting account, domain, DNS access, sender email account, and production billing method.
- Brand assets, company name, logo, customer-facing copy, terms, privacy policy, and any required disclaimers.
- Timely feedback during review cycles. Delayed feedback may move delivery dates.
- Any requested features outside the approved MVP scope. Out-of-scope work should be priced as a change order.
- Any vendor overage caused by requested high-frequency pulls, larger geography, more users, or protected-source scraping retries.

Developers should not be responsible for unpaid third-party bills, legal clearance, customer business licensing, manual data verification, source data inaccuracies, or delays caused by missing customer credentials and approvals.

## Source Links For API Costs

- Grants.gov API Guide: https://www.grants.gov/api/api-guide
- Socrata / Tyler Data & Insights app tokens and API keys: https://support.socrata.com/hc/en-us/articles/210138558-Generating-App-Tokens-and-API-Keys
- Bright Data Scraping Browser pricing: https://brightdata.com/pricing/scraping-browser
- Google Maps Platform pricing: https://mapsplatform.google.com/pricing/
- Google Maps Platform pricing overview: https://developers.google.com/maps/billing-and-pricing/overview
- Google Maps Platform subscriptions: https://developers.google.com/maps/billing-and-pricing/subscriptions

