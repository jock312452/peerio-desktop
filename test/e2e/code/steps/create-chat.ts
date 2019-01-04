import { Given, When, Then } from 'cucumber';

Given('A helper user is created', async function() {
    if (!this.users.helper) {
        this.users.helper = await this.newUser();
    }
});

When('I log in', async function() {
    if (!this.users.current) {
        this.users.current = await this.newUser();
    }

    await this.login.loginButton.click();
    await this.login.username.setValue(this.users.current.username);
    await this.login.accountKey.setValue(this.users.current.passphrase);
    await this.login.signInButton.click();
});

When('I start a DM with a user', async function() {
    await this.chatView.newDmButton.click();
    await this.newChat.userSearch.setValue(this.users.helper.username);
    await this.newChat.userListItem(this.users.helper.username).click();
});

Then('they are in my contacts', async function() {
    await this.contactsView.allContacts.click();
    await this.contactsView.search.setValue(this.users.helper.username);
    await this.contactsView.searchResultItem(this.users.helper.username);
});

When('I create a new room', async function() {
    await this.chatView.newRoomButton.click();
    await this.newChat.roomName.setValue('new room');
    await this.newChat.createRoomButton.click();
});

Then('I can send a message to the current chat', async function() {
    const message = Date.now().toString();
    await this.chatView.proseMirrorContainer.click();
    await this.chatView.sendMessage(`${message}\uE007`); // \uE007 = Enter
    await this.chatView.verifyMessage(message);
});
