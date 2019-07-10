define([
    'knockout',
    'uuid'
], function (
    ko,
    Uuid
) {
    'use strict';

    class ComponentRegistry {
        constructor() {
            this.installedStylesheets = {};
        }

        installStylesheet(id, stylesheet) {
            if (this.installedStylesheets[id]) {
                return;
            }
            const temp = document.createElement('div');
            temp.innerHTML = stylesheet;
            const style = temp.querySelector('style');
            style.id = 'componentStyle_' + id;
            if (!style) {
                // This means an invalid stylesheet was passed here.
                console.warn('Invalid component stylesheet, no style tag: ', stylesheet);
                return;
            }
            document.head.appendChild(style);
            this.installedStylesheets[id] = stylesheet;
        }

        registerComponent(componentFactory) {
            const name = new Uuid(4).format();
            const component = componentFactory();

            // wrap the view modei in a view model factory so we can always
            // pass the context with no fuss...
            // Note implies the view model is a class, not factory.

            let componentToRegister;
            if (component.viewModelWithContext) {
                const viewModelFactory = function (params, componentInfo) {
                    const context = ko.contextFor(componentInfo.element);
                    return new component.viewModelWithContext(params, context, componentInfo.element, componentInfo, name);
                };
                componentToRegister = {
                    viewModel: {
                        createViewModel: viewModelFactory
                    },
                    template: component.template
                };
            } else {
                componentToRegister = component;
            }

            ko.components.register(name, componentToRegister);

            if (component.stylesheet) {
                this.installStylesheet(name, component.stylesheet);
            }
            if (component.stylesheets) {
                component.stylesheets.forEach((sheet, index) => {
                    this.installStylesheet(name + '_' + index, sheet);
                });
            }

            return {
                name: function () {
                    return name;
                },
                quotedName: function () {
                    return '"' + name + '"';
                }
            };
        }
    }

    return new ComponentRegistry();
});
