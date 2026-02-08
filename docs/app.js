// --- Seeded pseudo-random number generator (mulberry32) ---
// Returns a function that produces a new random float in [0, 1) each call.
// Think of it like Python's random.Random(seed) — same seed always gives
// the same sequence of numbers.
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// --- Fisher-Yates shuffle ---
// Shuffles an array in place using the provided RNG function.
// Same algorithm Python uses internally for random.shuffle().
function shuffleArray(array, rng) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        // Swap — equivalent to Python's a, b = b, a
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Parse the names textarea into a clean array ---
function parseNames(text) {
    return text
        .split("\n")        // Split by newlines (like Python's str.splitlines())
        .map(function (s) { return s.trim(); })   // Strip whitespace from each
        .filter(function (s) { return s.length > 0; });  // Remove blank lines
}

// --- Fill 100 squares by cycling through names ---
// If you have 10 names, each appears 10 times.
// If you have 12 names, some appear 9 times, others 8.
// Python equivalent: (names * ceil(100/len(names)))[:100]
function fillSquares(names) {
    var squares = [];
    for (var i = 0; i < 100; i++) {
        squares.push(names[i % names.length]);
    }
    return squares;
}

// --- Build the 10x10 table as a DOM element ---
// The table has an optional extra column on the left for the row team label,
// and an optional extra row on top for the column team label.
function buildTable(squares, colTeam, rowTeam) {
    var table = document.createElement("table");
    // Total columns: 10 name cols + 1 digit col + (1 row-team col if rowTeam)
    var hasRowTeam = rowTeam && rowTeam.length > 0;
    var totalCols = hasRowTeam ? 12 : 11;

    // --- Column team label row (spans across the top) ---
    if (colTeam) {
        var colLabelRow = document.createElement("tr");
        if (hasRowTeam) {
            // Empty cell above the row-team column
            var spacer = document.createElement("th");
            colLabelRow.appendChild(spacer);
        }
        var colLabelCell = document.createElement("th");
        colLabelCell.colSpan = 11;   // corner + 10 digit columns
        colLabelCell.textContent = colTeam;
        colLabelCell.className = "team-label";
        colLabelRow.appendChild(colLabelCell);

        var labelHead = document.createElement("thead");
        labelHead.appendChild(colLabelRow);
        table.appendChild(labelHead);
    }

    // --- Header row: digits 0-9 ---
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");

    if (hasRowTeam) {
        // Empty cell above the row-team column
        var spacer2 = document.createElement("th");
        headerRow.appendChild(spacer2);
    }
    // Empty corner cell (above row digit headers)
    var cornerCell = document.createElement("th");
    headerRow.appendChild(cornerCell);

    for (var col = 0; col < 10; col++) {
        var th = document.createElement("th");
        th.scope = "col";
        th.textContent = col.toString();
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // --- Body: 10 rows, each with row-header digit + 10 name cells ---
    var tbody = document.createElement("tbody");
    for (var row = 0; row < 10; row++) {
        var tr = document.createElement("tr");

        // On the first row, add the row team label spanning all 10 rows
        if (row === 0 && hasRowTeam) {
            var rowTeamCell = document.createElement("th");
            rowTeamCell.rowSpan = 10;
            rowTeamCell.className = "row-team-label";
            rowTeamCell.textContent = rowTeam;
            tr.appendChild(rowTeamCell);
        }

        var rowHeader = document.createElement("th");
        rowHeader.scope = "row";
        rowHeader.textContent = row.toString();
        tr.appendChild(rowHeader);

        for (var c = 0; c < 10; c++) {
            var td = document.createElement("td");
            td.textContent = squares[row * 10 + c];
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}

// --- Wire up the form ---
// addEventListener is the JS equivalent of binding a callback in a GUI framework.
// "submit" fires when the user clicks the button or presses Enter in the form.
document.getElementById("squares-form").addEventListener("submit", function (event) {
    // Prevent the browser from reloading the page (default form behavior).
    // No Python equivalent — this is a browser-specific concept.
    event.preventDefault();

    // Read inputs from the form
    var namesText = document.getElementById("names-input").value;
    var seed = parseInt(document.getElementById("seed-input").value, 10);
    var colTeam = document.getElementById("col-team-input").value.trim();
    var rowTeam = document.getElementById("row-team-input").value.trim();

    // Validate
    var names = parseNames(namesText);
    if (names.length === 0) {
        alert("Please enter at least one name.");
        return;
    }
    if (names.length > 100) {
        alert("Too many names — the grid has exactly 100 squares. Please enter 100 or fewer names.");
        return;
    }
    if (isNaN(seed)) {
        alert("Please enter a valid number for the random seed.");
        return;
    }

    // Generate the grid: shuffle the name list first, then cycle that
    // shuffled order to fill all 100 cells. This way the repeating pattern
    // is consistent (e.g. C,A,B,C,A,B,...) rather than randomly scattered.
    var rng = mulberry32(seed);
    shuffleArray(names, rng);
    var filled = fillSquares(names);

    // Build and display the table
    var outputSection = document.getElementById("grid-output");
    outputSection.innerHTML = "";  // Clear any previous grid

    // Show info about name distribution
    var info = document.createElement("small");
    info.id = "grid-info";
    if (names.length === 100) {
        info.textContent = "100 names — each appears exactly once.";
    } else {
        var perName = Math.floor(100 / names.length);
        var extra = 100 % names.length;
        if (extra === 0) {
            info.textContent = names.length + " names \u00d7 " + perName + " squares each.";
        } else {
            info.textContent = names.length + " names — some appear " + perName +
                " times, others " + (perName + 1) + " times.";
        }
    }
    outputSection.appendChild(info);

    outputSection.appendChild(buildTable(filled, colTeam, rowTeam));

    // Add a print button so users can save/print the grid as a landscape PDF.
    // window.print() opens the browser's native print dialog, which includes
    // "Save as PDF" on all modern browsers. No library needed.
    var printBtn = document.createElement("button");
    printBtn.textContent = "Print Grid";
    printBtn.className = "print-btn";
    printBtn.addEventListener("click", function () { window.print(); });
    outputSection.appendChild(printBtn);

    // "Copy Share Link" button — builds a URL with the current inputs as
    // query parameters so anyone opening the link sees the same grid.
    // Uses navigator.clipboard API (like Python's pyperclip.copy()).
    var shareBtn = document.createElement("button");
    shareBtn.textContent = "Copy Share Link";
    shareBtn.className = "share-btn secondary";  // Pico "secondary" = outline style
    shareBtn.addEventListener("click", function () {
        var shareParams = new URLSearchParams();
        shareParams.set("names", names.join(","));
        shareParams.set("seed", seed.toString());
        if (colTeam) shareParams.set("colTeam", colTeam);
        if (rowTeam) shareParams.set("rowTeam", rowTeam);
        var shareUrl = window.location.origin + window.location.pathname + "?" + shareParams.toString();
        navigator.clipboard.writeText(shareUrl).then(function () {
            shareBtn.textContent = "Copied!";
            setTimeout(function () { shareBtn.textContent = "Copy Share Link"; }, 2000);
        });
    });
    outputSection.appendChild(shareBtn);

    outputSection.hidden = false;
});

// --- URL parameter support ---
// URLSearchParams is a built-in browser API for reading query strings.
// Similar to Python's urllib.parse.parse_qs(). If the URL contains
// ?names=Mike,Alice,Bob&seed=2026, we pre-fill the form and auto-generate.
var params = new URLSearchParams(window.location.search);
if (params.has("names")) {
    // Names are comma-separated in the URL; convert to newline-separated for the textarea
    document.getElementById("names-input").value = params.get("names").split(",").join("\n");
}
if (params.has("seed")) {
    document.getElementById("seed-input").value = params.get("seed");
}
if (params.has("colTeam")) {
    document.getElementById("col-team-input").value = params.get("colTeam");
}
if (params.has("rowTeam")) {
    document.getElementById("row-team-input").value = params.get("rowTeam");
}
// If names were provided via URL, auto-generate the grid immediately.
// dispatchEvent fires the "submit" event, which triggers our existing handler
// above — no need to duplicate any logic.
if (params.has("names")) {
    document.getElementById("squares-form").dispatchEvent(new Event("submit"));
}
