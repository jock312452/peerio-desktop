import path from 'path';
import { remote as electron } from 'electron';

import { chatStore, t, LocalizationStrings } from 'peerio-icebear';
import { Chat } from 'peerio-icebear/dist/models';

import sounds from '~/helpers/sounds';
import uiStore from '~/stores/ui-store';
import appState from '~/stores/app-state';
import routerStore from '~/stores/router-store';
import config from '~/config';

import { bringAppToFront } from './helpers';

const { app } = electron;

interface MessageNotificationInit {
    chat: Chat;
    lastMessageText: string;
    unreadCount: number;
    freshBatchMentionCount?: number;
}

const notifications: { [chatId: string]: Notification } = {};

class MessageNotification {
    chat: Chat;
    lastMessageText: string;
    counter: number;
    translationKeyword: string;
    userDesktopNotificationCondition: boolean;
    userSoundsCondition: boolean;

    constructor(props: MessageNotificationInit) {
        this.chat = props.chat;
        this.lastMessageText = props.lastMessageText;
        this.counter = props.unreadCount;
        this.translationKeyword = 'Messages';
        this.userDesktopNotificationCondition = uiStore.prefs.messageDesktopNotificationsEnabled;
        this.userSoundsCondition = uiStore.prefs.messageSoundsEnabled;
    }

    send() {
        if (this.userDesktopNotificationCondition) this.showDesktopNotification();
        if (this.userSoundsCondition) this.playSound();
    }

    showDesktopNotification() {
        if (!appState.isActive) {
            let body = this.lastMessageText;
            if (this.counter >= config.chat.pageSize) {
                body = t(`notification_manyNew${
                    this.translationKeyword
                }` as keyof LocalizationStrings) as string;
            }
            // FIXME: else if, not just else? otherwise this will always
            // overwrite the body value?
            if (this.counter > 1) {
                body = t(
                    `notification_new${this.translationKeyword}` as keyof LocalizationStrings,
                    {
                        count: this.counter
                    }
                ) as string;
            }
            this.postDesktopNotification(this.chat.name, body);
        }
    }

    playSound() {
        sounds.received.play();
    }

    handleClick = () => {
        if (this.chat) {
            bringAppToFront();

            // Activate chat.
            routerStore.navigateTo(routerStore.ROUTES.chats);
            chatStore.activate(this.chat.id);

            // Focus on message input.
            uiStore.focusMessageInput();
        }
    };

    postDesktopNotification(title: string, body: string) {
        if (!title || !body) return;
        // replace existing notification -- only one per chat
        if (notifications[this.chat.id]) {
            notifications[this.chat.id].close();
        }
        const props: NotificationOptions = {
            body,
            silent: true
        };

        // icon needed for Windows, looks weird on Mac
        if (config.os !== 'Darwin') {
            props.icon = path.join(app.getAppPath(), 'build/static/img/notification-icon.png');
        }

        const notification = new Notification(title, props);
        notification.onclick = this.handleClick;
        notifications[this.chat.id] = notification;
    }
}

class MentionNotification extends MessageNotification {
    constructor(props: MessageNotificationInit) {
        super(props);
        this.userDesktopNotificationCondition = uiStore.prefs.mentionDesktopNotificationsEnabled;
        this.userSoundsCondition = uiStore.prefs.mentionSoundsEnabled;
        this.translationKeyword = 'Mentions';

        // FIXME: the below code was setting `counter` to undefined, but a fix
        // may cause additional problems (see `FIXME` below.)
        this.counter = undefined;
        // this.unreadCount > config.chat.pageSize
        //     ? this.unreadCount
        //     : this.freshBatchMentionCount;
    }
}

class DMNotification extends MessageNotification {
    constructor(props: MessageNotificationInit) {
        super(props);
        this.userDesktopNotificationCondition = uiStore.prefs.mentionDesktopNotificationsEnabled;
        this.userSoundsCondition = uiStore.prefs.mentionSoundsEnabled;

        // FIXME: i just noticed that `notification_manyNewDMs` doesn't actually
        // exist, but it's concealed by the fact that
        //
        // - the counter code above to set the notification body doesn't
        //   evaluate conditions correctly
        // - the value of `counter` set here will always be `undefined`.
        //
        // so if you fix this, add new localization strings and maybe fix the
        // counter code bug above at the same time!
        this.translationKeyword = 'DMs';
        this.counter = undefined;
        // this.unreadCount > config.chat.pageSize
        //     ? this.unreadCount
        //     : this.freshBatchMentionCount;
    }
}

export function sendMessageNotification(props: MessageNotificationInit) {
    if (!props.chat.isChannel) {
        const m = new DMNotification(props);
        m.send();
    } else if (props.freshBatchMentionCount) {
        const m = new MentionNotification(props);
        m.send();
    }
    const m = new MessageNotification(props);
    m.send();
}
