import Page from '../page';

export default class ChatView extends Page {
    get newRoomButton() {
        return this.element('chatList_newRoom');
    }

    get newDmButton() {
        return this.element('chatList_newDm');
    }

    get messageList() {
        return this.element('messageList');
    }

    getLatestMessageText = async () => {
        const text = this.messageList
            .element('.message-content-wrapper:last-of-type')
            .element('.message-body p')
            .getAttribute('innerHTML');
        return text;
    };

    verifyMessage = async (text: string) => {
        const latestMessageText = await this.getLatestMessageText();
        return latestMessageText === text;
    };

    get proseMirrorContainer() {
        // 1st `element` = defined in page.ts, finds matching data-test-id
        // 2nd `element` = Webdriver's, finds match via regular CSS selector
        return this.element('messageInputContainer').element('div.ProseMirror');
    }

    sendMessage = async (text: string) => {
        await this.proseMirrorContainer;
        if (this.proseMirrorContainer) {
            this.browser.keys(text);
        }
    };
}
