import Page from '../page';

export default class AppNav extends Page {
    get goToChatButton() {
        return this.element('button_goToChat');
    }

    get goToFilesButton() {
        return this.element('button_goToFiles');
    }

    get goToContactsButton() {
        return this.element('button_goToContacts');
    }
}
