function setStyle(colorbg, colorte, colortb, colortt) {
    // ToDo: fix this, this is horible
    let style = document.createElement('style');
    style.innerHTML = `

    body, input, select, textarea, h1, h2, h3, h4, h5, h6, .smsc-title--1, .course__block, .news__feed__button__content, .topnav__menu, .topnav__menuitem, .toolbar, .folders, .helper--height--mega, .modern-message, .smscMainBlockContainer, .nodata_msg, .eval_content, .smscToolbar, .course, .smscleftnavcontainer, .smsc-column-nav__button, .notification__btn, #smscMainBlockContainer, .smscAdminNav_body_linkdivText, .smscAdminNav_body_linkdivTitle, .smsc-container, .smsc-tree__item__title, #smscFrameTitlePanel, .postbox_link, .toaster__toast, .full_pie_icon, .eval_title, .eval_comment, .notifs-toaster__toast, .notification, #smscMain, .smscComposeMessage, #msg_bg, .msg_button, .tabmain, .templateselectdiv, .templateName, .templateRow, .login-app__linkbutton, .login-app__infoblock--margin-bottom, .login-app__infoblock--title, .login-app__infoblock, .searchDivResult, #modal-content, .side-panel__panel {
        color: ` + colorte + ` !important;
        background-color: ` + colorbg + ` !important;
    }

    #msgdetail, #agenda_main, .eval_grid_graph, #uploadzone, #tree, #resizeHandle, #mod_content_center, .searchInputField, #subjectInput, #navNext, #navPrev, .calendarMainTable, .smsc_cm_body_row_block, .smsc_cm_body_row_block_indien, .searchInputField {
        color: #000000 !important;
        background-color: #ffffff !important;
    }

    .compose_title, .usersContainerBlockText {
        color: #000000 !important;
    }

    .topnav, .topnav__btn, .topnav__title {
        color: ` + colortt + ` !important;
        background-color: ` + colortb + ` !important;
    }

    .smsc-topnav .topnav__menu-arrow:after {
        border-color: ` + colorbg + ` transparent !important;
    }
    `;
    document.head.appendChild(style);
}

chrome.storage.sync.get({
    theme: 'light',
    colorbg: '#FFFFFF',
    colorte: '#262626',
    colortb: '#FF520E',
    colortt: '#FFFFFF',
}, function (items) {
    if (items.theme == 'dark') {
        setStyle('#292929', '#ffffff', '#333333', '#ffffff');
    }
    else if (items.theme == 'custom') {
        setStyle(items.colorbg, items.colorte, items.colortb, items.colortt);
    }
});
