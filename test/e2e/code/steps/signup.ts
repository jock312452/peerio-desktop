import { Given, When, Then } from 'cucumber';

When('I choose the create account option', async function() {
    await this.signup.signupButton.click();
});

When('I input my personal info', async function() {
    this.username = Date.now().toString();
    await this.signup.firstName.setValue('Alice');
    await this.signup.lastName.setValue('Sparks');
    await this.signup.nextButton.click();

    await this.signup.username.setValue(this.username);
    await this.signup.nextButton.click();

    await this.signup.email.setValue(`${this.username}@test.lan`);
    await this.signup.nextButton.click();
});

Then('I am presented with my passcode', async function() {
    await this.signup.copyButton.click();

    await this.signup.snackbar.click();
    await this.signup.snackbarGone;

    await this.signup.nextButton.click();

    await this.signup.acceptButton.click();
    await this.signup.shareButton.click();
});

Then('I am taken to the home tab', async function() {
    await this.signup.element(this.username);
});

Given('I have signed up', async function() {
    await this.signup.signupButton.click();

    this.username = Date.now();
    await this.signup.firstName.setValue('Alice');
    await this.signup.lastName.setValue('Sparks');
    await this.signup.nextButton.click();

    await this.signup.username.setValue(this.username);
    await this.signup.nextButton.click();

    await this.signup.email.setValue(`${this.username}@test.lan`);
    await this.signup.nextButton.click();

    await this.signup.copyButton.click();

    await this.signup.snackbar.click();
    await this.signup.snackbarGone;

    await this.signup.nextButton.click();

    await this.signup.acceptButton.click();
    await this.signup.shareButton.click();

    await this.signup.element(this.username);
});

Given('I close Peerio', async function() {
    // hook will only save last instance run logs, so we need to help it remember previous runs (within same scenario)
    if (!this.cachedLogs) {
        this.cachedLogs = [];
    }
    this.cachedLogs.push({
        main: await this.app.client.getMainProcessLogs(),
        renderer: await this.app.client.getRenderProcessLogs()
    });
    await this.stopApp();
});

When('I open Peerio', async function() {
    await this.openApp();
});
