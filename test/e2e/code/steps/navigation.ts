import { Given, When, Then } from 'cucumber';

When('I navigate to Chat', async function() {
    await this.appNav.goToChatButton.click();
});

When('I navigate to Files', async function() {
    await this.appNav.goToFilesButton.click();
});

When('I navigate to Contacts', async function() {
    await this.appNav.goToContactsButton.click();
});
