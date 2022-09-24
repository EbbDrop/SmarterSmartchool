var targetNode = $('#smscMain')[0];

var callback = function(mutationsList, observer) {
    for (var mutation of mutationsList) {
        if (mutation.type == 'attributes') {
            main()
        }
    }
};

var observer = new MutationObserver(callback);

observer.observe(targetNode, { attributes: true, childList: true, subtree: true });

function main() {
    if ($('#gridview').length && !$('#gridview').find('input').length) {
        calculateTotalGrid();
    }
    if ($('.courseEvals').length && !$('.courseEvals').find('input').length && !$('.courseEvals').find('.gradesList_nodata').length) {
        calculateTotalList();
    }
}

function calculateTotalList() {
    $('<input>').attr('type', 'hidden').appendTo('.courseEvals');

    var total_numerator = 0;
    var total_denominator = 0;
    $('.courseEvals').children().each(function (e) {
        var cell = $(this).find('.evalpoint').text();
        var match = cell.match(/([\d\,\.]+)\/([\d\,\.]+)/);
        if (match) {
            total_numerator += parseFloat(match[1].replace(',', '.'))
            total_denominator += parseFloat(match[2].replace(',', '.'))
        }
    });
    var div = $('<div>');
    div.addClass('evals_eval cf');
    div.append(
        $('<div>').addClass('eval_data').append(
            $('<div>').addClass('eval_info grades').append(
                $('<div>').addClass('eval_title titleOnly').html(
                    '&nbsp;&nbsp;Totaal:&nbsp;' + totalToStr(total_numerator, total_denominator)
                )
            )
        )
    );
    $('.courseEvals').prepend(div);
}

function calculateTotalGrid() {
    $('<input>').attr('type', 'hidden').appendTo('#gridview');

    var rows = $('.grid_course_evals').children();
    rows.each(function (e) {
        var row = $(this);

        var total_numerator = 0;
        var total_denominator = 0;
        row.children().each(function (e) {
            var cell = $(this).text();
            var match = cell.match(/([\d\,\.]+)\/([\d\,\.]+)/);
            if (match) {
                total_numerator += parseFloat(match[1].replace(',', '.'))
                total_denominator += parseFloat(match[2].replace(',', '.'))
            }
        });

        var div = $('<div>');
        div.addClass('course_eval_cell');
        if (total_denominator > 0) {
            if (total_numerator / total_denominator < 0.5) {
                div.addClass('isLow');
            }
            div.text(totalToStr(total_numerator, total_denominator));
            div.css('font-weight', 'Bold');
        }
        row.append(div);
        row.width(row.width() + 70)
    });
}

function totalToStr(total_numerator, total_denominator) {
    return (Math.round(total_numerator / total_denominator * 1000) / 10).toString() + '%';
}
