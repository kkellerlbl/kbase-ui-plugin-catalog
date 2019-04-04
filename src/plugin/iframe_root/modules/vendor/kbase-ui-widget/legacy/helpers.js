define([
    'jquery',
    'kb_common/html'
], function (
    $,
    html
) {
    'use strict';
    // jQuery plugins that you can use to add and remove a 
    // loading giff to a dom element.
    $.fn.rmLoading = function () {
        $(this).find('.loader').remove();
    };
    $.fn.loading = function (text, big) {
        var div = html.tag('div');
        $(this).rmLoading();
        // TODO: handle "big"
        $(this).append(div({ class: 'loader' }, html.loading(text)));
        return this;
    };
});