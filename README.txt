N.J. OVERTIME BY FACILITY — PATCH-STYLE DATA TABLE

FOLDER STRUCTURE

nj_overtime_facility_table_patch/
├── index.html
├── styles.css
├── app.js
└── data/
    └── nj_2025_overtime_by_facility.csv


1. COPY YOUR CSV

Put your completed facility-level CSV here:

data/nj_2025_overtime_by_facility.csv


2. REQUIRED CSV COLUMNS

Entity
Department
Employees_With_OT
Median_OT
P25_OT
P75_OT
Lowest_OT
Highest_OT
Employees_100K_OT
Pct_100K_OT


3. RUN LOCALLY

Because app.js loads the CSV with fetch(), do not double-click index.html.

From Terminal:

cd "/Users/ainsleymartinez/Downloads/nj_overtime_facility_table_patch"
python3 -m http.server 8000

Then open:

http://localhost:8000


Or use VS Code's Live Server extension.


4. FONTS

The page uses:
- Merriweather for body/table text
- Roboto for headlines, navigation, controls and labels

The fonts load from Google Fonts. If blocked, the CSS includes system fallbacks.


5. TABLE BEHAVIOR

The page:
- automatically loads the facility CSV
- hides Department = Not Provided by default
- supports live search
- supports entity filtering
- supports quick filters
- supports column sorting
- supports pagination
- displays median OT
- displays the middle 50% (P25–P75)
- displays the full overtime range
- displays number and percentage with $100K+ overtime


6. IMPORTANT DENOMINATOR NOTE

Pct_100K_OT is the percentage among employees who received overtime, not the
facility's complete workforce.
