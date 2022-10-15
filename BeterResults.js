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
  return "GRID!"
}

function onLoad() {
  var style = document.createElement('style');
  style.innerHTML = `
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
