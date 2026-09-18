const DATA_URL = "./data/nj_2025_overtime_by_facility.csv";

const state = {
  facilities: [],
  filtered: [],
  page: 1,
  pageSize: 50,
  sortKey: "medianOT",
  sortDirection: "desc",
  quickFilter: "all"
};

const els = {
  dataApp: document.getElementById("dataApp"),
  loadStatus: document.getElementById("loadStatus"),
  searchInput: document.getElementById("searchInput"),
  entityFilter: document.getElementById("entityFilter"),
  includeMissing: document.getElementById("includeMissing"),
  pageSize: document.getElementById("pageSize"),
  tableBody: document.getElementById("tableBody"),
  resultsText: document.getElementById("resultsText"),
  pageInfo: document.getElementById("pageInfo"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  facilityCount: document.getElementById("facilityCount"),
  workerCount: document.getElementById("workerCount"),
  highOtCount: document.getElementById("highOtCount")
};

document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  setStatus("Loading facility data…");

  try {
    const response = await fetch(DATA_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Could not load CSV: HTTP ${response.status}`);
    }

    const text = await response.text();
    const rows = parseCSV(text);

    const required = [
      "Entity",
      "Department",
      "Employees_With_OT",
      "Median_OT",
      "P25_OT",
      "P75_OT",
      "Lowest_OT",
      "Highest_OT",
      "Employees_100K_OT",
      "Pct_100K_OT"
    ];

    const headers = rows.length ? Object.keys(rows[0]) : [];

    const missing = required.filter(
      column => !headers.includes(column)
    );

    if (missing.length) {
      throw new Error(
        `CSV missing required columns: ${missing.join(", ")}`
      );
    }

    state.facilities = rows.map(row => ({
      entity: cleanText(row["Entity"]) || "Unknown",

      department:
        cleanText(row["Department"]) ||
        "Not Provided",

      employeesWithOT:
        toNumber(row["Employees_With_OT"]),

      medianOT:
        toNumber(row["Median_OT"]),

      p25OT:
        toNumber(row["P25_OT"]),

      p75OT:
        toNumber(row["P75_OT"]),

      lowestOT:
        toNumber(row["Lowest_OT"]),

      highestOT:
        toNumber(row["Highest_OT"]),

      employees100k:
        toNumber(row["Employees_100K_OT"]),

      pct100k:
        toNumber(row["Pct_100K_OT"])
    }));

    populateEntityFilter(state.facilities);

    bindControls();

    els.dataApp.classList.remove("hidden");

    setStatus(
      `${formatInteger(state.facilities.length)} facility rows loaded`
    );

    syncSortIndicator();

    applyFiltersAndRender();

  } catch (error) {
    console.error(error);

    els.dataApp.classList.add("hidden");

    setStatus(
      "Could not load facility data. Check that data/nj_2025_overtime_by_facility.csv exists in the GitHub repo.",
      true
    );
  }
}


// ============================================================
// CONTROLS
// ============================================================

function bindControls() {

  els.searchInput.addEventListener(
    "input",
    () => {
      state.page = 1;
      applyFiltersAndRender();
    }
  );


  els.entityFilter.addEventListener(
    "change",
    () => {
      state.page = 1;
      applyFiltersAndRender();
    }
  );


  els.includeMissing.addEventListener(
    "change",
    () => {
      state.page = 1;
      applyFiltersAndRender();
    }
  );


  els.pageSize.addEventListener(
    "change",
    () => {
      state.pageSize =
        Number(els.pageSize.value);

      state.page = 1;

      render();
    }
  );


  document
    .querySelectorAll(".filter-chip")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".filter-chip")
            .forEach(chip => {
              chip.classList.remove("active");
            });

          button.classList.add("active");

          state.quickFilter =
            button.dataset.filter;

          state.page = 1;

          applyFiltersAndRender();
        }
      );

    });


  document
    .querySelectorAll("th.sortable")
    .forEach(th => {

      th.addEventListener(
        "click",
        () => {

          const key =
            th.dataset.key;

          const type =
            th.dataset.type;


          if (
            state.sortKey === key
          ) {

            state.sortDirection =
              state.sortDirection === "asc"
                ? "desc"
                : "asc";

          } else {

            state.sortKey = key;

            state.sortDirection =
              type === "text"
                ? "asc"
                : "desc";
          }


          state.page = 1;

          syncSortIndicator();

          render();
        }
      );

    });


  els.prevPage.addEventListener(
    "click",
    () => {

      if (state.page > 1) {

        state.page -= 1;

        render();
      }

    }
  );


  els.nextPage.addEventListener(
    "click",
    () => {

      const totalPages =
        getTotalPages();


      if (
        state.page < totalPages
      ) {

        state.page += 1;

        render();
      }

    }
  );
}


// ============================================================
// FILTER
// ============================================================

function applyFiltersAndRender() {

  const query =
    els.searchInput.value
      .trim()
      .toLowerCase();


  const selectedEntity =
    els.entityFilter.value;


  const showMissing =
    els.includeMissing.checked;


  state.filtered =
    state.facilities.filter(row => {

      if (
        !showMissing &&
        isMissingDepartment(
          row.department
        )
      ) {
        return false;
      }


      if (
        selectedEntity &&
        row.entity !== selectedEntity
      ) {
        return false;
      }


      if (query) {

        const haystack =
          `${row.department} ${row.entity}`
            .toLowerCase();


        if (
          !haystack.includes(query)
        ) {
          return false;
        }

      }


      if (
        state.quickFilter === "median25" &&
        row.medianOT < 25000
      ) {
        return false;
      }


      if (
        state.quickFilter === "pct5" &&
        row.pct100k < 5
      ) {
        return false;
      }


      if (
        state.quickFilter === "pct10" &&
        row.pct100k < 10
      ) {
        return false;
      }


      return true;

    });


  render();
}


// ============================================================
// RENDER TABLE
// ============================================================

function render() {

  const sorted =
    [...state.filtered]
      .sort(compareRows);


  const totalPages =
    getTotalPages();


  if (
    state.page > totalPages
  ) {
    state.page = totalPages;
  }


  const start =
    (state.page - 1) *
    state.pageSize;


  const pageRows =
    sorted.slice(
      start,
      start + state.pageSize
    );


  if (
    pageRows.length === 0
  ) {

    els.tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:32px;">
          No facilities match these filters.
        </td>
      </tr>
    `;

  } else {

    els.tableBody.innerHTML =
      pageRows
        .map(row => `
          <tr>

            <td>
              ${escapeHTML(row.department)}
            </td>

            <td>
              ${escapeHTML(row.entity)}
            </td>

            <td class="numeric">
              ${formatInteger(
                row.employeesWithOT
              )}
            </td>

            <td class="numeric">
              ${formatMoney(
                row.medianOT
              )}
            </td>

            <td class="money-range">
              ${formatMoney(row.p25OT)}
              –
              ${formatMoney(row.p75OT)}
            </td>

            <td class="money-range">
              ${formatMoney(row.lowestOT)}
              –
              ${formatMoney(row.highestOT)}
            </td>

            <td class="numeric">
              ${formatInteger(
                row.employees100k
              )}
            </td>

            <td class="numeric">
              ${formatPercent(
                row.pct100k
              )}
            </td>

          </tr>
        `)
        .join("");
  }


  els.resultsText.textContent =
    `Showing ${
      formatInteger(sorted.length)
    } ${
      sorted.length === 1
        ? "facility"
        : "facilities"
    }`;


  els.pageInfo.textContent =
    `Page ${state.page} of ${totalPages}`;


  els.prevPage.disabled =
    state.page <= 1;


  els.nextPage.disabled =
    state.page >= totalPages;


  updateSummary(sorted);
}


// ============================================================
// SUMMARY
// ============================================================

function updateSummary(rows) {

  els.facilityCount.textContent =
    formatInteger(rows.length);


  const workers =
    rows.reduce(
      (sum, row) =>
        sum + row.employeesWithOT,
      0
    );


  const highOT =
    rows.reduce(
      (sum, row) =>
        sum + row.employees100k,
      0
    );


  els.workerCount.textContent =
    formatInteger(workers);


  els.highOtCount.textContent =
    formatInteger(highOT);
}


// ============================================================
// PAGINATION
// ============================================================

function getTotalPages() {

  return Math.max(
    1,
    Math.ceil(
      state.filtered.length /
      state.pageSize
    )
  );
}


// ============================================================
// SORTING
// ============================================================

function compareRows(a, b) {

  const key =
    state.sortKey;


  const direction =
    state.sortDirection === "asc"
      ? 1
      : -1;


  const av = a[key];
  const bv = b[key];


  if (
    typeof av === "string"
  ) {

    return (
      av.localeCompare(
        bv,
        undefined,
        {
          sensitivity: "base"
        }
      ) *
      direction
    );

  }


  return (
    (av - bv) *
    direction
  );
}


function syncSortIndicator() {

  document
    .querySelectorAll(
      "th.sortable"
    )
    .forEach(th => {

      th.classList.remove(
        "sort-asc",
        "sort-desc"
      );


      if (
        th.dataset.key ===
        state.sortKey
      ) {

        th.classList.add(
          state.sortDirection === "asc"
            ? "sort-asc"
            : "sort-desc"
        );

      }

    });
}


// ============================================================
// ENTITY DROPDOWN
// ============================================================

function populateEntityFilter(
  facilities
) {

  const entities =
    [
      ...new Set(
        facilities
          .map(
            row => row.entity
          )
          .filter(Boolean)
      )
    ]
      .sort(
        (a, b) =>
          a.localeCompare(b)
      );


  els.entityFilter.innerHTML =
    `
      <option value="">
        All entities
      </option>
    `
    +
    entities
      .map(
        entity => `
          <option
            value="${escapeAttribute(entity)}"
          >
            ${escapeHTML(entity)}
          </option>
        `
      )
      .join("");
}


// ============================================================
// CSV PARSER
// ============================================================

function parseCSV(text) {

  const rows = [];

  let row = [];
  let field = "";
  let inQuotes = false;


  const source =
    text.replace(
      /^\uFEFF/,
      ""
    );


  for (
    let i = 0;
    i < source.length;
    i++
  ) {

    const char =
      source[i];

    const next =
      source[i + 1];


    if (inQuotes) {

      if (
        char === '"' &&
        next === '"'
      ) {

        field += '"';
        i++;

      } else if (
        char === '"'
      ) {

        inQuotes = false;

      } else {

        field += char;
      }


      continue;
    }


    if (
      char === '"'
    ) {

      inQuotes = true;

    } else if (
      char === ","
    ) {

      row.push(field);

      field = "";

    } else if (
      char === "\n"
    ) {

      row.push(field);

      rows.push(row);

      row = [];

      field = "";

    } else if (
      char !== "\r"
    ) {

      field += char;
    }

  }


  if (
    field.length ||
    row.length
  ) {

    row.push(field);

    rows.push(row);
  }


  if (
    rows.length === 0
  ) {

    throw new Error(
      "CSV appears empty."
    );
  }


  const headers =
    rows
      .shift()
      .map(
        header =>
          cleanText(header)
      );


  return rows

    .filter(
      values =>
        values.some(
          value =>
            cleanText(value) !== ""
        )
    )

    .map(
      values => {

        const record = {};


        headers.forEach(
          (header, index) => {

            record[header] =
              values[index] ?? "";

          }
        );


        return record;
      }
    );
}


// ============================================================
// HELPERS
// ============================================================

function toNumber(value) {

  const cleaned =
    String(
      value ?? ""
    )
      .replace(
        /[$,%\s]/g,
        ""
      )
      .replaceAll(
        ",",
        ""
      )
      .replace(
        /^\((.*)\)$/,
        "-$1"
      );


  const number =
    Number(cleaned);


  return Number.isFinite(number)
    ? number
    : 0;
}


function cleanText(value) {

  return String(
    value ?? ""
  ).trim();
}


function isMissingDepartment(value) {

  const normalized =
    cleanText(value)
      .toLowerCase();


  return (
    normalized === "" ||
    normalized ===
      "not provided" ||
    normalized === "n/a" ||
    normalized === "na"
  );
}


function formatMoney(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }
  ).format(value);
}


function formatInteger(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0
    }
  ).format(value);
}


function formatPercent(value) {

  return `${Number(value).toFixed(1)}%`;
}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeAttribute(value) {

  return escapeHTML(value);
}


function setStatus(
  message,
  isError = false
) {

  els.loadStatus.textContent =
    message;


  els.loadStatus
    .classList
    .toggle(
      "error",
      isError
    );
}
