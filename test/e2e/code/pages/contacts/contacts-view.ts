import Page from '../page';

export default class ContactsList extends Page {
    get favoriteContacts() {
        return this.element('favoriteContacts');
    }

    get allContacts() {
        return this.element('allContacts');
    }

    get invitedContacts() {
        return this.element('invitedContacts');
    }

    get search() {
        return this.element('input_contactSearch');
    }

    searchResultItem(username: string) {
        return this.element(`listItem_${username}`);
    }
}
