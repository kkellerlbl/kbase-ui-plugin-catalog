define([
    'knockout'
], function (
    ko
) {
    'use strict';

    function svgTemplateLoader(name, templateConfig, callback) {
        if (!templateConfig.svg) {
            callback(null);
            return;
        }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.innerHTML = templateConfig.svg;
        callback(svg.childNodes);
    }
    ko.components.loaders.unshift({
        loadTemplate: svgTemplateLoader
    });
});
