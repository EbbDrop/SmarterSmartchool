var wideToolbarCallback = function(mutationsList, _) {
  for (var mutation of mutationsList) {
    if (mutation.type == 'childList' && mutation.removedNodes.length != 0) {
      for (const node of mutation.removedNodes) {
        if (node.id == "show-grid") {
          $(".wide-toolbar").append(node);
        }
      }
    }
  }
};

var wideToolbarObserver = new MutationObserver(wideToolbarCallback);

var smscMainCallback = function(mutationsList, observer) {
  for (var mutation of mutationsList) {
    if (mutation.type == 'childList' && mutation.addedNodes.length == 1 && mutation.addedNodes[0].classList.contains('wide-toolbar')) {
      observer.disconnect();
      wideToolbarObserver.observe($('.wide-toolbar')[0], { attributes: false, childList: true, subtree: false });
      onLoad();
      addButton();
    }
  }
};

var smscMainObserver = new MutationObserver(smscMainCallback);
smscMainObserver.observe($('#smscMain')[0], { attributes: false, childList: true, subtree: false });

function totalToStr(total_numerator, total_denominator) {
  return (Math.round(total_numerator / total_denominator * 1000) / 10).toString() + '%';
}

function addButton() {
  $(".wide-toolbar").append(
    $("<button/>")
      .attr("id", "show-grid")
      .addClass("wide-toolbar__item").append(
        $("<img/>").addClass("wide-toolbar__item__icon").attr("src", chrome.runtime.getURL("static/img/icon_128.png"))
      ).append(
        $("<span/>").addClass("wide-toolbar__item__name").text("Grid")
      ).click(openGrid)
  )
}

function makeGrid() {
  var loading = $("<h3>Loading!</h3>");
  fetch('/results/api/v1/evaluations?itemsOnPage=500').then(r => r.json()).then(results => {
    console.log(results);
    var data = {};
    var course_to_graphic = {};
    for (const result of results) {
      let period = result["period"]["name"];
      if (!(period in data)) {
        data[period] = {};
      }

      period = data[period];
      for (const course of result["courses"]) {
        course_to_graphic[course["name"]] = course["graphic"]
        const course_name = course["name"];
        if (!(course_name in period)) {
          period[course_name] = [];
        }
        period[course_name].push({ "date": result["date"], "graphic": result["graphic"] })
      }
    }

    var longest = 0;
    for (var [_, period] of Object.entries(data)) {
      for (var [_, course] of Object.entries(period)) {
        course.sort((a, b) => { return a["date"].localeCompare(b["date"]); })
        if (course.length > longest) {
          longest = course.length;
        }
      }
    }
    for (var period_name of Object.keys(data)) {
      var grid = $("<div/>").append($("<h2/>").text(period_name + ":"));
      var table = $("<table/>").attr("id", "result-table");
      for (var [course_name, course] of Object.entries(period)) {
        var row = $("<tr/>");
        if (course_to_graphic[course_name].type == "icon") {
          row.append($("<th/>").append(
            $("<span/>")
              .addClass("icon-label icon-label--24 smsc-svg--" + course_to_graphic[course_name]["value"] + "--24")
              .text(course_name)
          ));
        } else {
          row.append($("<th/>").text(course_name));
        }

        var total_numerator = 0;
        var total_denominator = 0;
        for (const result of course) {
          const desc = result["graphic"]["description"];
          const color = result["graphic"]["color"];
          row.append($("<td/>").addClass("c-" + color + "-combo--100").text(desc));

          var match = desc.match(/^([\d\,\.]+)\/([\d\,\.]+)$/);
          if (match) {
            total_numerator += parseFloat(match[1].replace(',', '.'))
            total_denominator += parseFloat(match[2].replace(',', '.'))
          }
        }

        for (var i = 0; i < longest - course.length; i++) {
          row.append($("<td/>"));
        }

        var last_cell = $("<td/>").addClass("total");
        if (total_denominator != 0) {
          last_cell.text(totalToStr(total_numerator, total_denominator));
          if (total_numerator / total_denominator < 0.5) {
            last_cell.addClass('is-low');
          }
        }
        row.append(last_cell);
        table.append(row);
      }
      grid.append(table);
      data[period_name] = grid;
    }

    var modal = $("<div/>");
    var period_buttons = $("<div/>");
    var main_grid = $("<div/>").attr("id", "table-container");
    for (var [period_name, _] of Object.entries(data)) {
      period_buttons.append($("<button/>").text(period_name).click(() => {
        main_grid.empty();
        main_grid.append(data[period_name]);
      }));
    }
    console.log(course_to_graphic);
    period_buttons.children().last().click();
    if (period_buttons.children().length > 1) {
      modal.append(period_buttons);
    }
    modal.append(main_grid);
    loading.replaceWith(modal);
  })
  return loading;
}

function onLoad() {
  var style = document.createElement('style');
  style.innerHTML = `

.total {
    font-weight: bold;
}

.is-low {
    color: red !important;
}

#table-container {
    overflow-y: scroll;
}

#result-table {
    margin-top: 1rem;
    border: 0px;
}

th {
    text-align: left;
}

td {
    text-align: center;
}

th, td {
    border: 1px solid gray !important;
    padding: 0.5rem;
    min-width: 5.5rem;
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
    float: right;
}
  `;
  document.head.appendChild(style);

  $("body").append(
    $("<div/>").attr("id", "modal-background")
  ).append(
    $("<div/>").attr("id", "modal-content").append(
      $("<button/>").attr("id", "modal-close").text("Close")
    ).append(makeGrid())
  )

  $("#modal-background, #modal-close").click(function() {
    $("#modal-content, #modal-background").toggleClass("active");
  });
}

function openGrid() {
  $("#modal-content, #modal-background").toggleClass("active");
}
