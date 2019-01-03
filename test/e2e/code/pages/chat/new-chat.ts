import Page from '../page';

export default class NewChat extends Page {
    get roomName() {
        return this.element('input_roomName');
    }

    get userSearch() {
        return this.element('input_userSearch');
    }

    userListItem(username: string) {
        return this.element(`listItem_${username}`);
    }

    get createDmButton() {
        return this.element('button_createDm');
    }

    get createRoomButton() {
        return this.element('button_createRoom');
    }
}
