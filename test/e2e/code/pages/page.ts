export default class Page {
    browser: WebdriverIO.Client<void>;
    constructor(app) {
        this.browser = app.client;
    }

    withLabel = label => `[data-test-id='${label}']`;

    element = label => {
        const elem = this.withLabel(label);

        return this.browser
            .waitForExist(elem)
            .waitForVisible(elem)
            .waitForEnabled(elem)
            .element(elem);
    };

    gone = label => {
        const elem = this.withLabel(label);

        return this.browser.waitForExist(elem).waitForVisible(elem, 5000, true);
    };
}
