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
function buildTable(squares, colTeam, rowTeam) {
    var table = document.createElement("table");

    // --- Column team label row (spans across the top) ---
    if (colTeam) {
        var colLabelRow = document.createElement("tr");
        var colLabelCell = document.createElement("th");
        colLabelCell.colSpan = 11;          // 1 corner + 10 digit columns
        colLabelCell.textContent = colTeam;
        colLabelCell.className = "team-label";
        colLabelRow.appendChild(colLabelCell);

        var labelHead = document.createElement("thead");
        labelHead.appendChild(colLabelRow);
        table.appendChild(labelHead);
    }

    // --- Header row: empty corner + digits 0-9 ---
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");

    // If there's a row team name, put it in the corner cell
    var cornerCell = document.createElement("th");
    cornerCell.textContent = rowTeam || "";
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

    // Generate the grid
    var filled = fillSquares(names);
    var rng = mulberry32(seed);
    shuffleArray(filled, rng);

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
    outputSection.hidden = false;
});
