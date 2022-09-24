// Saves options to chrome.storage
function save_options() {
    var theme = $('#theme').val();
    var colorbg = $('#colorbg').val();
    var colorte = $('#colorte').val();
    var colortb = $('#colortb').val();
    var colortt = $('#colortt').val();
    chrome.storage.sync.set({
        theme: theme,
        colorbg: colorbg,
        colorte: colorte,
        colortb: colortb,
        colortt: colortt,
    }, function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
        });
    });
}

function theme_change(e) {
    var theme = $('#theme').val();
    if (theme == 'custom') {
        $('#colors').show();
    } else {
        $('#colors').hide();
    }
}

function restore_options() {
    chrome.storage.sync.get({
        theme: 'light',
        colorbg: '#FFFFFF',
        colorte: '#262626',
        colortb: '#FF520E',
        colortt: '#FFFFFF',
    }, function (items) {
            $('#theme').val(items.theme);
            $('#colorbg').attr('value', items.colorbg);
            $('#colorte').attr('value', items.colorte);
            $('#colortb').attr('value', items.colortb);
            $('#colortt').attr('value', items.colortt);
            $('.color').minicolors({
                theme: 'bootstrap'
            });
            theme_change();
    });
}

$(function () {
    $('#save').click(save_options);
    restore_options();
    $('#theme').change(theme_change);
});
