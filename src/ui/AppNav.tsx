import path from 'path';
import { remote } from 'electron';
import React from 'react';
import { autorun, observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { Avatar, Divider, Menu, MenuHeader, MenuItem } from 'peer-ui';
import { User, contactStore, chatStore, t, LocalizationStrings } from 'peerio-icebear';

import UsageCloud from '~/ui/shared-components/UsageCloud';
import SignoutDialog from '~/ui/shared-components/SignoutDialog';
import {
    sendMessageNotification,
    sendInviteAcceptedNotification,
    sendInviteNotification
} from '~/helpers/notifications';
import { relaunch as relaunchApp } from '~/helpers/app-control';
import { disable as disableAutologin } from '~/helpers/autologin';
import routerStore from '~/stores/router-store';

import config from '~/config';
import updaterStore from '~/stores/updater-store';
import AppNavBeaconedItem from './AppNavBeaconedItem';

const urls = config.translator.urlMap;
const { ROUTES } = routerStore;
const { app, nativeImage } = remote;

// todo: move this somewhere more appropriate
let dockNotifsStarted = false;
function startDockNotifications() {
    // if (dockNotifsStarted || (!app.setBadgeCount && !app.dock && !app.dock.bounce)) return;
    if (dockNotifsStarted) return;
    dockNotifsStarted = true;
    autorun(
        () => {
            const unreadItems = chatStore.unreadMessages;
            // mac
            if (app.setBadgeCount && app.dock && app.dock.bounce) {
                if (app.setBadgeCount) app.setBadgeCount(unreadItems);
                if (unreadItems > 0) {
                    app.dock.bounce();
                }
            }
        },
        { delay: 250 }
    );
}

let taskbarOverlayStarted = false;
function startTaskbarOverlay() {
    // if (dockNotifsStarted || (!app.setBadgeCount && !app.dock && !app.dock.bounce)) return;
    if (taskbarOverlayStarted) return;
    taskbarOverlayStarted = true;
    autorun(
        () => {
            const unreadItems = chatStore.unreadMessages;
            // windows
            if (typeof remote.getCurrentWindow().setOverlayIcon === 'function') {
                const overlay = nativeImage.createFromPath(
                    path.join(app.getAppPath(), 'build/static/img/taskbar-overlay.png')
                );
                remote
                    .getCurrentWindow()
                    .setOverlayIcon(unreadItems ? overlay : null, unreadItems ? 'newmessages' : '');
            }
        },
        { delay: 250 }
    );
}

let desktopNotificationsStarted = false;
function startDesktopNotifications() {
    if (desktopNotificationsStarted) return;
    desktopNotificationsStarted = true;
    chatStore.events.on(chatStore.EVENT_TYPES.messagesReceived, sendMessageNotification);
    chatStore.events.on(chatStore.EVENT_TYPES.invitedToChannel, sendInviteNotification);
    contactStore.events.on(contactStore.EVENT_TYPES.inviteAccepted, sendInviteAcceptedNotification);
}

@observer
export default class AppNav extends React.Component {
    @observable isConfirmSignOutVisible = false;

    toChats = () => routerStore.navigateTo(ROUTES.chats);
    toFiles = () => routerStore.navigateTo(ROUTES.files);
    toContacts = () => routerStore.navigateTo(ROUTES.contacts);
    toProfile = () => routerStore.navigateTo(ROUTES.profile);
    toSecurity = () => routerStore.navigateTo(ROUTES.security);
    toPrefs = () => routerStore.navigateTo(ROUTES.prefs);
    toAccount = () => routerStore.navigateTo(ROUTES.account);
    toAbout = () => routerStore.navigateTo(ROUTES.about);
    toHelp = () => routerStore.navigateTo(ROUTES.help);
    toOnboarding = () => routerStore.navigateTo(ROUTES.onboarding);

    componentWillMount() {
        // since this component shows new items notifications, we also make it show dock icon notifications
        startDockNotifications();
        startDesktopNotifications();
        startTaskbarOverlay();
    }

    @computed
    get menuItems() {
        const hideUpgrade = config.disablePayments || User.current.hasActivePlans;

        interface MenuItem {
            value?: string;
            icon?: string;
            customIcon?: string;
            caption?: keyof LocalizationStrings;
            className?: string;
            hidden?: boolean;
            divider?: boolean;
            route?: string;
            clickFunction?: string;
        }

        const menuContent: MenuItem[] = [
            {
                value: 'Profile',
                customIcon: 'public-profile',
                caption: 'title_settingsProfile',
                className: css('profile', 'custom-icon-hover-container', {
                    'avatar-notify': !User.current.primaryAddressConfirmed
                })
            },
            {
                value: 'Security',
                icon: 'security',
                caption: 'title_settingsSecurity'
            },
            {
                value: 'Preferences',
                customIcon: 'preferences',
                caption: 'title_settingsPreferences',
                className: 'preferences custom-icon-hover-container',
                route: 'prefs',
                clickFunction: 'toPrefs'
            },
            {
                value: 'Account',
                icon: 'account_circle',
                caption: 'title_settingsAccount'
            },
            {
                value: 'About',
                icon: 'info',
                caption: 'title_About'
            },
            {
                value: 'Help',
                icon: 'help',
                caption: 'title_help'
            },
            {
                hidden: hideUpgrade,
                divider: true
            },
            {
                hidden: hideUpgrade,
                value: 'Upgrade',
                icon: 'open_in_browser',
                caption: 'button_upgrade'
            },
            {
                divider: true
            },
            {
                value: 'Signout',
                customIcon: 'signout',
                caption: 'button_logout',
                className: css('signout', 'custom-icon-hover-container'),
                clickFunction: 'signout'
            },
            {
                value: 'Quit',
                icon: 'power_settings_new',
                caption: updaterStore.readyToInstall ? 'title_updateAndQuit' : 'title_quit',
                clickFunction: 'quit' // note: Quit and Update & Quit are the same action: just quitting the app.
            }
        ];

        return menuContent.map((m, i) => {
            if (m.hidden) return null;
            // eslint-disable-next-line react/no-array-index-key
            if (m.divider) return <Divider key={`divider-${i}`} />;

            const value = m.value.toLowerCase();
            const className = m.className ? m.className : value;
            const route = m.route ? m.route : value;
            const clickFunction = m.clickFunction ? m.clickFunction : `to${m.value}`;

            return (
                <MenuItem
                    key={value}
                    value={value}
                    caption={t(m.caption) as string}
                    className={className}
                    icon={m.icon}
                    customIcon={m.customIcon}
                    selected={routerStore.currentRoute === ROUTES[route]}
                    onClick={this[clickFunction]}
                />
            );
        });
    }

    _doSignout = async untrust => {
        disableAutologin();
        await User.current.signout(untrust);
        relaunchApp();
    };

    signout = async () => {
        this.isConfirmSignOutVisible = true;
    };

    quit = () => {
        app.quit();
    };

    cancelSignout = () => {
        this.isConfirmSignOutVisible = false;
    };

    toUpgrade() {
        return window.open(urls.upgrade);
    }

    render() {
        const contact = contactStore.getContact(User.current.username);
        const { currentRoute } = routerStore;
        const { primaryAddressConfirmed } = User.current;

        return (
            <div className="app-nav">
                <div className="avatar-menu-wrapper">
                    <div
                        className={css({
                            'avatar-notify': !primaryAddressConfirmed
                        })}
                    />
                    <Menu
                        customButton={<Avatar contact={contact} size="medium" />}
                        position="top-left"
                        theme="wide"
                        innerClassName="app-nav-menu"
                    >
                        <MenuHeader
                            leftContent={
                                <Avatar contact={contact} size="medium" onClick={this.toProfile} />
                            }
                            caption={contact.fullName}
                            legend={contact.username}
                        />
                        <Divider />
                        {this.menuItems}
                    </Menu>
                </div>
                <div className="app-menu">
                    <AppNavBeaconedItem
                        beaconName="chat"
                        tooltip={t('title_chats')}
                        icon="forum"
                        active={
                            currentRoute.startsWith(ROUTES.chats) ||
                            currentRoute.startsWith(ROUTES.patients)
                        }
                        showBadge={chatStore.badgeCount > 0}
                        onClick={this.toChats}
                        testId="button_goToChat"
                    />
                    <AppNavBeaconedItem
                        beaconName="files"
                        tooltip={t('title_files')}
                        icon="folder"
                        active={currentRoute.startsWith(ROUTES.files)}
                        onClick={this.toFiles}
                        testId="button_goToFiles"
                    />
                    <AppNavBeaconedItem
                        beaconName="contact"
                        tooltip={t('title_contacts')}
                        icon="people"
                        active={currentRoute.startsWith(ROUTES.contacts)}
                        onClick={this.toContacts}
                        testId="button_goToContacts"
                    />
                    <UsageCloud onClick={this.toOnboarding} />
                </div>
                <SignoutDialog
                    active={this.isConfirmSignOutVisible}
                    onHide={this.cancelSignout}
                    onSignout={this._doSignout}
                />
            </div>
        );
    }
}
