# Bank Report UI & Parameter Invariants

### 1. Section Navigator (Navbar) Invariants
- `FloatingNavigator` pills MUST NOT contain any numbers, numbering ranges, Roman numerals, or letter prefixes.
- Strip all leading numbers, letters, and Roman numerals (e.g. `1. `, `6-8. `, `A. `, `VII & VIII. `, `Points 1 - 4`).
- Pills must display clean, human-readable titles (e.g. `Basic Details`, `Market Comparison & Remarks`).
- Pills must never render badge numbering circles.

### 2. Section Header Alignment
- Form `<Section>` titles and `navSections` titles must match 1-to-1 identically.
- Eliminate arbitrary numbering prefixes in form section titles so they mirror the navbar.
- Do NOT pass `sectionNumber` props to attachment sections (`BaseDocumentsSection`, `BaseMapsSection`, `BasePhotographsSection`) to avoid badge number resets (e.g. `[ 1 ] Verified Documents`).

### 3. Active Configuration Banner Truthfulness
- `ActiveConfigBanner` must strictly reflect only the user's actual selection path from the Report Setup Wizard:
  1. Client Type (`ORGANISATION / BANK` or `INDIVIDUAL`)
  2. Category (`BANK & FIS`, `NBFC / PRIVATE LENDING`, etc.)
  3. Bank / Organisation Name (e.g. `YES BANK`, `TATA CAPITAL LTD`)
  4. Sub-template ONLY IF explicitly selected in the wizard (e.g. `SME-BLG`, `HL-LAP`, `Land & Building`).
- NEVER inject `'Standard'`, `'Valuation Report'`, `'Default'`, or any hardcoded fallback as a subclass badge.
