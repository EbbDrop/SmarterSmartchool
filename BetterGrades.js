let targetNode = $('#smscMain')[0];

let callback = function(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type == 'attributes') {
            main()
        }
    }
};

let observer = new MutationObserver(callback);

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

    let total_numerator = 0;
    let total_denominator = 0;
    $('.courseEvals').children().each(function (e) {
        let cell = $(this).find('.evalpoint').text();
        let match = cell.match(/([\d\,\.]+)\/([\d\,\.]+)/);
        if (match) {
            total_numerator += parseFloat(match[1].replace(',', '.'))
            total_denominator += parseFloat(match[2].replace(',', '.'))
        }
    });
    let div = $('<div>');
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

    let rows = $('.grid_course_evals').children();
    rows.each(function (e) {
        let row = $(this);

        let total_numerator = 0;
        let total_denominator = 0;
        row.children().each(function (e) {
            let cell = $(this).text();
            let match = cell.match(/([\d\,\.]+)\/([\d\,\.]+)/);
            if (match) {
                total_numerator += parseFloat(match[1].replace(',', '.'))
                total_denominator += parseFloat(match[2].replace(',', '.'))
            }
        });

        let div = $('<div>');
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
