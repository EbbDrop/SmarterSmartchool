const sidebar_selector = ".sidebar-results>:first-child";

let wideToolbarCallback = function (mutationsList, _) {
  for (let mutation of mutationsList) {
    if (mutation.type == "childList" && mutation.removedNodes.length != 0) {
      for (const node of mutation.removedNodes) {
        if (node.id == "show-grid") {
          console.log("Readding grid afther smartschool removed it");
          addButton();
        }
      }
    }
  }
};

let wideToolbarObserver = new MutationObserver(wideToolbarCallback);

let smscMainCallback = function (mutationsList, observer) {
  wideToolbarObserver.observe($(sidebar_selector)[0], {
    attributes: false,
    childList: true,
    subtree: false,
  });
  onLoad();
  addButton();
};

let smscMainObserver = new MutationObserver(smscMainCallback);
smscMainObserver.observe($("#smscMain")[0], {
  attributes: false,
  childList: true,
  subtree: false,
});

function totalToStr(total_numerator, total_denominator) {
  return (
    (Math.round((total_numerator / total_denominator) * 1000) / 10).toString() +
    "%"
  );
}

function addButton() {
  console.log("Added button");
  if (document.getElementById("show-grid")) {
    console.log("Skiped");
    return;
  }

  $(sidebar_selector).append(
    $("<button/>")
      .attr("id", "show-grid")
      .addClass("optionWrapper-IEDUX")
      .addClass("button-mJfIq")
      .append(
        $("<img/>")
          .addClass("icon-dus_u")
          .attr("src", chrome.runtime.getURL("static/img/icon_128.png"))
          .attr("width", 24)
          .attr("height", 24)
          .attr("id", "show-grid-icon"),
      )
      .append(
        $("<span/>")
          .addClass("label-dOebJ")
          .text("Grid")
          .attr("id", "show-grid-label"),
      )
      .click(openGrid),
  );
  console.log("Added button");
}

function makeGrid() {
  let loading = $("<h3>Loading!</h3>");
  fetch("/results/api/v1/evaluations?itemsOnPage=500")
    .then((r) => r.json())
    .then((results) => {
      let data = {};
      let course_to_graphic = {};
      let latest_period = null;
      for (const result of results) {
        if (result["type"] != "normal") {
          continue;
        }
        let period = result["period"]["name"];
        if (latest_period === null) {
          latest_period = period;
        }
        if (!(period in data)) {
          data[period] = {};
        }

        period = data[period];
        for (const course of result["courses"]) {
          course_to_graphic[course["name"]] = course["graphic"];
          const course_name = course["name"];
          if (!(course_name in period)) {
            period[course_name] = [];
          }
          period[course_name].push({
            date: result["date"],
            name: result["name"],
            graphic: result["graphic"],
          });
        }
      }

      let grids = {};
      let all_subjects = new Set();
      for (let period_name of Object.keys(data)) {
        for (let course of Object.keys(data[period_name])) {
          all_subjects.add(course);
        }
      }
      all_subjects = Array.from(all_subjects).sort();
      let all_periods = Object.keys(data);

      let summary_grid = $("<div/>")
        .attr("id", "period")
        .append($("<h2/>").text("Overzicht:"));
      let summary_table = $("<table/>").attr("id", "result-table");

      let sum_header = $("<tr/>");
      sum_header.append($("<th/>").text("Vak"));
      for (let period_name of all_periods) {
        sum_header.append($("<th/>").text(period_name));
      }
      sum_header.append($("<th/>").text("Totaal"));
      summary_table.append(sum_header);

      let period_totals = {};
      for (let period_name of all_periods) {
        period_totals[period_name] = { num: 0, den: 0 };
      }
      let grand_total_num = 0;
      let grand_total_den = 0;

      for (let course_name of all_subjects) {
        let row = $("<tr/>");

        if (
          course_name in course_to_graphic &&
          course_to_graphic[course_name].type == "icon"
        ) {
          row.append(
            $("<th/>").append(
              $("<span/>")
                .addClass(
                  "icon-label icon-label--24 smsc-svg--" +
                    course_to_graphic[course_name]["value"] +
                    "--24",
                )
                .text(course_name),
            ),
          );
        } else {
          row.append($("<th/>").text(course_name));
        }

        let subj_total_num = 0;
        let subj_total_den = 0;

        for (let period_name of all_periods) {
          let p_num = 0;
          let p_den = 0;
          if (data[period_name] && data[period_name][course_name]) {
            for (let result of data[period_name][course_name]) {
              let desc = result["graphic"]["description"];
              let match = desc.match(/^([\d\,\.]+)\/([\d\,\.]+)$/);
              if (match) {
                p_num += parseFloat(match[1].replace(",", "."));
                p_den += parseFloat(match[2].replace(",", "."));
              }
            }
          }

          let cell = $("<td/>");
          if (p_den != 0) {
            cell.text(totalToStr(p_num, p_den));
            if (p_num / p_den < 0.5) cell.addClass("is-low");
            subj_total_num += p_num;
            subj_total_den += p_den;
            period_totals[period_name].num += p_num;
            period_totals[period_name].den += p_den;
          }
          row.append(cell);
        }

        let tot_cell = $("<td/>").addClass("total");
        if (subj_total_den != 0) {
          tot_cell.text(totalToStr(subj_total_num, subj_total_den));
          if (subj_total_num / subj_total_den < 0.5)
            tot_cell.addClass("is-low");
          grand_total_num += subj_total_num;
          grand_total_den += subj_total_den;
        }
        row.append(tot_cell);
        summary_table.append(row);
      }

      let overallRow = $("<tr/>");
      overallRow.append($("<th/>").text("Totaal"));
      for (let period_name of all_periods) {
        let cell = $("<td/>").addClass("total");
        if (period_totals[period_name].den != 0) {
          let p_num = period_totals[period_name].num;
          let p_den = period_totals[period_name].den;
          cell.text(totalToStr(p_num, p_den));
          if (p_num / p_den < 0.5) cell.addClass("is-low");
        }
        overallRow.append(cell);
      }
      let grandTotCell = $("<td/>").addClass("total");
      if (grand_total_den != 0) {
        grandTotCell.text(totalToStr(grand_total_num, grand_total_den));
        if (grand_total_num / grand_total_den < 0.5)
          grandTotCell.addClass("is-low");
      }
      overallRow.append(grandTotCell);
      summary_table.append(overallRow);
      summary_grid.append(
        $("<div/>").attr("id", "table-container").append(summary_table),
      );
      grids["Overzicht"] = summary_grid;

      for (let period_name of Object.keys(data)) {
        let period = data[period_name];

        let grid = $("<div/>")
          .attr("id", "period")
          .append($("<h2/>").text(period_name + ":"));
        let table = $("<table/>").attr("id", "result-table");

        let longest = 0;
        for (let [_, course] of Object.entries(period)) {
          course.sort((a, b) => {
            return a["date"].localeCompare(b["date"]);
          });
          if (course.length > longest) {
            longest = course.length;
          }
        }
        let overallTotalNumerator = 0;
        let overallTotalDenominator = 0;

        for (let [course_name, course] of Object.entries(period)) {
          let row = $("<tr/>");
          if (course_to_graphic[course_name].type == "icon") {
            row.append(
              $("<th/>").append(
                $("<span/>")
                  .addClass(
                    "icon-label icon-label--24 smsc-svg--" +
                      course_to_graphic[course_name]["value"] +
                      "--24",
                  )
                  .text(course_name),
              ),
            );
          } else {
            row.append($("<th/>").text(course_name));
          }

          let total_numerator = 0;
          let total_denominator = 0;

          for (const result of course) {
            const desc = result["graphic"]["description"];
            const color = result["graphic"]["color"];
            const name = result["name"];
            let cellDesc = desc || "/"; // If desc is empty, use "-/-"

            row.append(
              $("<td/>")
                .addClass("c-" + color + "-combo--300")
                .attr({ id: "details", content: name })
                .text(cellDesc),
            );

            let match = desc.match(/^([\d\,\.]+)\/([\d\,\.]+)$/);
            if (match) {
              total_numerator += parseFloat(match[1].replace(",", "."));
              total_denominator += parseFloat(match[2].replace(",", "."));
            }
          }

          for (let i = 0; i < longest - course.length; i++) {
            row.append($("<td/>"));
          }

          let last_cell = $("<td/>").addClass("total");
          if (total_denominator != 0) {
            last_cell.text(totalToStr(total_numerator, total_denominator));
            if (total_numerator / total_denominator < 0.5) {
              last_cell.addClass("is-low");
            }
          }
          row.append(last_cell);

          overallTotalNumerator += total_numerator;
          overallTotalDenominator += total_denominator;

          table.append(row);
        }

        let overallTotalRow = $("<tr/>");
        overallTotalRow.append($("<th/>").text("Totaal"));
        for (let i = 0; i < longest; i++) {
          overallTotalRow.append($("<td/>"));
        }
        let overallTotalCell = $("<td/>").addClass("total");
        if (overallTotalDenominator != 0) {
          overallTotalCell.text(
            totalToStr(overallTotalNumerator, overallTotalDenominator),
          );
          if (overallTotalNumerator / overallTotalDenominator < 0.5) {
            overallTotalCell.addClass("is-low");
          }
        }
        overallTotalRow.append(overallTotalCell);
        table.append(overallTotalRow);

        grid.append($("<div/>").attr("id", "table-container").append(table));
        grid.append(
          $("<div/>")
            .addClass("disclaimer-text")
            .text(
              "Deze totalen kunnen afwijken van uw werkelijke resultaten doordat niet altijd alle gegevens gekend zijn.",
            ),
        );
        grids[period_name] = grid;
      }

      let modal = $("<div/>").attr("id", "content-container");
      let period_picker = $("<div/>").addClass("period-picker");
      let period_header = $("<div/>").addClass("period-header");
      let period_active_label = $("<span/>")
        .addClass("period-active-label")
        .text("Overzicht");
      let period_dropdown = $("<div/>").addClass("period-dropdown");
      let period_toggle = $("<button/>")
        .attr("type", "button")
        .addClass("period-toggle")
        .text("Overzicht")
        .append($("<span/>").addClass("period-caret").text("▼"));
      let period_menu = $("<div/>").addClass("period-menu");
      let main_grid = $("<div/>").attr("id", "period-container");

      // Keep reverse order but put "Overzicht" first
      let ordered_periods = ["Overzicht", ...Object.keys(data).reverse()];
      let selected_period = "Overzicht";

      function renderPeriodButtonLabel() {
        const labelText = selected_period || "Selecteer periode";
        period_toggle.contents().first()[0].textContent = labelText + " ";
        period_active_label.text(labelText);
      }

      function renderSelectedPeriods() {
        main_grid.empty();
        if (selected_period && grids[selected_period]) {
          main_grid.append(grids[selected_period].clone(true, true));
        }
      }

      for (let period_name of ordered_periods) {
        let option_row = $("<label/>")
          .addClass("period-option")
          .append(
            $("<input/>")
              .attr("type", "radio")
              .attr("name", "period-selection")
              .addClass("period-radio")
              .attr("data-period", period_name)
              .prop("checked", period_name === "Overzicht"),
          )
          .append(
            $("<span/>").addClass("period-option-label").text(period_name),
          );
        period_menu.append(option_row);
      }

      period_menu.on("change", ".period-radio", function () {
        const period_name = $(this).attr("data-period");
        selected_period = period_name;
        renderPeriodButtonLabel();
        renderSelectedPeriods();
        period_dropdown.removeClass("open");
      });

      function positionPeriodMenu() {
        const rect = period_toggle[0].getBoundingClientRect();
        period_menu.css({
          top: rect.bottom + 6 + "px",
          left: rect.left + "px",
          width: Math.max(rect.width, 240) + "px",
        });
      }

      period_toggle.on("click", function (e) {
        e.stopPropagation();
        const willOpen = !period_dropdown.hasClass("open");
        period_dropdown.toggleClass("open");
        if (willOpen) {
          positionPeriodMenu();
        }
      });

      $(window).on("resize scroll", function () {
        if (period_dropdown.hasClass("open")) {
          positionPeriodMenu();
        }
      });

      $(document).on("click", function () {
        period_dropdown.removeClass("open");
      });

      period_menu.on("click", function (e) {
        e.stopPropagation();
      });

      period_header.append(
        period_dropdown.append(period_toggle, period_menu),
        period_active_label,
      );
      period_picker.append(period_header);
      if (ordered_periods.length > 1) {
        modal.append(period_picker);
      }

      renderPeriodButtonLabel();
      renderSelectedPeriods();
      modal.append(main_grid);
      loading.replaceWith(modal);
    });
  return loading;
}

function onLoad() {
  if (document.getElementById("grid-style")) {
    return;
  }
  let style = document.createElement("style");
  style.id = "grid-style";
  style.innerHTML = `

.disclaimer-text {
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    text-align: left;
    font-style: italic;
}

#details {
  position: relative;
}

#details:hover::before {
  visibility: visible;
  opacity: 0.9;
}

#details::before {
  z-index: 2;
  content: attr(content);
  color: white;
  background-color: #1a1a1a;
  visibility: hidden;
  position: absolute;
  text-align: center;
  padding: 0.313rem 0;
  border-radius: 0.375rem;
  opacity: 0;
  transition: opacity .6s;
  width: 15rem;
  top: 100%;
  left: 50%;
  margin-left: -7.5rem;
}

.period-picker {
  margin-bottom: 0.9rem;
}

.period-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.period-active-label {
  font-size: 1rem;
  font-weight: 700;
  color: #4a4a4a;
}

.period-dropdown {
  position: relative;
  display: inline-block;
}

.period-toggle {
  background-color: #f3c000;
  border: 1px solid #c39d00;
  color: #1f1f1f;
  border-radius: 0.45rem;
  padding: 0.4rem 0.7rem;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.2;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.period-toggle:hover {
  background-color: #efbc00;
}

.period-toggle:active {
  background-color: #e3b100;
}

.period-caret {
  font-size: 0.72rem;
  color: #2f2f2f;
}

.period-menu {
  display: none;
  position: fixed;
  min-width: 260px;
  max-height: min(360px, 62vh);
  overflow: auto;
  background: #f7f7f7;
  border: 1px solid #cfcfcf;
  border-radius: 0.3rem;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 2001;
  padding: 0.4rem 0.6rem 0.4rem 0.4rem;
}

.period-dropdown.open .period-menu {
  display: block;
}

.period-option {
  display: flex;
  align-items: left;
  gap: 0.62rem;
  padding: 0.52rem 0.72rem;
  min-height: 2.2rem;
  cursor: pointer;
  user-select: none;
}

.period-option:hover {
  background-color: #ececec;
}

.period-option input[type="radio"] {
  margin: 0;
  width: 0.98rem;
  height: 0.98rem;
  accent-color: #FF520E;
  flex: 0 0 auto;
}

.period-option-label {
  color: #444;
  font-size: 0.96rem;
  font-weight: 500;
}

.period-option:has(input[type="radio"]:checked) {
  background-color: #B8B8B8;
}

.period-option:has(input[type="radio"]:checked) .period-option-label {
  color: #2a2a2a;
  font-weight: 700;
}



.total {
    font-weight: bold;
}

.is-low {
    color: red !important;
}

#table-container {
  flex: 1 1 auto;
  overflow: auto;
  min-width: 0;
}

#period {
  height: 100%;
  display: flex;
  flex-direction: column;
}

#period-container {
  flex: 1;
  min-height: 0;
}

#content-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

#result-table {
    margin-top: 1rem;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #cecece;
}

#result-table th {
    text-align: left;
    background-color: #f8f8f8;
}

#result-table td {
    text-align: center;
}

#result-table th, #result-table td {
    border-right: 1px solid #cecece !important;
    border-bottom: 1px solid #cecece !important;
    border-left: none !important;
    border-top: none !important;
    padding: 0.5rem;
    min-width: 5.5rem;
}

#result-table tr:last-child th,
#result-table tr:last-child td {
    border-bottom: none !important;
}

#result-table th:last-child,
#result-table td:last-child {
    border-right: none !important;
}

#result-table tr:nth-child(even) th {
    background-color: #f4f6f7;
}

#modal-background {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    opacity: .50;
    -webkit-opacity: .5;
    -moz-opacity: .5;
    filter: alpha(opacity=50);
    z-index: 1000;
}

#modal-content {
    background-color: white;
    border-radius: 10px;
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    box-shadow: 0 0 20px 0 #222;
    -webkit-box-shadow: 0 0 20px 0 #222;
    -moz-box-shadow: 0 0 20px 0 #222;
    display: none;
    padding: 10px;
    position: fixed;
    z-index: 1000;
    left: 10%;
    top: 10%;
    width: 80%;
    height: 80%;
}

#modal-background.active, #modal-content.active {
    display: block;
}

#modal-close {
  background-color: transparent;
  border: none;
  color: #888;
  padding: 0.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
  position: absolute;
  right: 1rem;
  top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
#modal-close:hover {
  color: #333;
}
#modal-close:active {
  color: #ff520e;
}

#show-grid {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 48px;
  transition-property: background-color,height,border-color,box-shadow;
  transition-duration: .15s;
  overflow: hidden;
  border-radius: .66666667rem;
  border: 1px solid transparent;
  padding: 0 .83333333rem;
}

#show-grid-icon {
  margin-right: .83333333rem;
}
    `;
  document.head.appendChild(style);

  $("body")
    .append($("<div/>").attr("id", "modal-background"))
    .append(
      $("<div/>")
        .attr("id", "modal-content")
        .append(
          $("<button/>")
            .attr("id", "modal-close")
            .html(
              '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            ),
        )
        .append(makeGrid()),
    );

  $("#modal-background, #modal-close").click(function () {
    $("#modal-content, #modal-background").removeClass("active");
  });

  $(document).keydown(function (e) {
    if (e.key === "Escape") {
      $("#modal-content, #modal-background").removeClass("active");
    }
  });
}

function openGrid() {
  $("#modal-content, #modal-background").addClass("active");
}
