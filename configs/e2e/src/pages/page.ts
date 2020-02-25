class Page {
    open(url = ""): void {
        browser.url("/" + url);
    }

    existing(selector: string): boolean {
        return $(selector).isExisting();
    }
    getElement(selector: string): WebdriverIO.Element {
        const element = $(selector);
        element.waitForDisplayed();
        return element;
    }

    getElements(selector: string): WebdriverIO.Element[] {
        $(selector).waitForDisplayed();
        const elements = $$(selector);
        return elements;
    }

    getWidget(widgetName: string): WebdriverIO.Element {
        return this.getElement(`.mx-name-${widgetName}`);
    }

    getWidgets(widgetName: string): WebdriverIO.Element[] {
        return this.getElements(`.mx-name-${widgetName}`);
    }

    headerElement(pageTitle = "pageTitle1"): WebdriverIO.Element {
        return this.getWidget(pageTitle);
    }

    header(pageTitle = "pageTitle1"): string {
        return this.headerElement(pageTitle).getText();
    }

    get modalDialog(): WebdriverIO.Element {
        return $(".modal-dialog");
    }

    get modalDialogHeader(): WebdriverIO.Element {
        return this.modalDialog.$("#mxui_widget_Window_0_caption");
    }
}

export default new Page();
