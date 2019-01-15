/*
    ELEMENTS are parts of whitelabel UI which are not big enough to justify their own component.
    e.g. individual functions and getters, very minor text differences, etc.
*/

import React from 'react';
import config from '~/config';
import { contactStore, chatStore, User } from 'peerio-icebear';
import { Chat } from 'peerio-icebear/dist/models';
import routerStore from '~/stores/router-store';
import T from '~/ui/shared-components/T';
import STRINGS from './strings';

class ELEMENTS {
    get currentView() {
        return routerStore.ROUTES_INVERSE[routerStore.currentRoute];
    }

    textParser = {
        toCreateDM: (text: string) => {
            return (
                <a
                    className="clickable"
                    onClick={() => routerStore.navigateTo(routerStore.ROUTES.newChat)}
                >
                    {text}
                </a>
            );
        },
        toCreateRoom: (text: string) => {
            return (
                <a
                    className="clickable"
                    onClick={() => routerStore.navigateTo(routerStore.ROUTES.newChannel)}
                >
                    {text}
                </a>
            );
        },
        toCreatePatient: (text: string) => {
            return (
                <a
                    className="clickable"
                    onClick={() => routerStore.navigateTo(routerStore.ROUTES.newPatient)}
                >
                    {text}
                </a>
            );
        }
    };

    get newChannel() {
        const obj: {
            title: JSX.Element;
            description: JSX.Element | JSX.Element[];
            acceptFunction: string;
            context?: 'newchat' | 'newpatientspace' | 'patientroom';
        } = {
            title: (
                <T k={STRINGS.newChannel.title} tag="span">
                    {{ patientName: chatStore.spaces.currentSpaceName }}
                </T>
            ),
            description: [
                <T key="new-channel-description" k={STRINGS.newChannel.description} />,
                <T key="new-channel-offer-dm" k={STRINGS.newChannel.offerDM}>
                    {this.textParser}
                </T>
            ],
            acceptFunction: 'createNewChannel'
        };

        if (config.whiteLabel.name === 'medcryptor') {
            if (this.currentView === 'newPatient') {
                obj.description = <T k={STRINGS.newChannel.offerDM}>{this.textParser}</T>;

                obj.acceptFunction = 'createNewPatientSpace';

                obj.context = 'newpatientspace';
            }

            if (this.currentView === 'newInternalRoom') {
                obj.description = <T k={STRINGS.newChannel.description} />;

                obj.acceptFunction = 'createNewInternalRoom';
            }

            if (this.currentView === 'newPatientRoom') {
                obj.title = (
                    <T k={STRINGS.newChannel.title} tag="span">
                        {{ patientName: chatStore.spaces.currentSpaceName }}
                    </T>
                );

                obj.description = <T k={STRINGS.newChannel.description} />;

                obj.acceptFunction = 'createNewPatientRoom';

                obj.context = 'patientroom';
            }
        }

        return obj;
    }

    get newChat() {
        const obj = {
            description: [
                <T key="new-chat-desc" k="title_newDirectMessageDescription" />,
                <T key="new-chat-offer-room" k={STRINGS.newChat.offerRoom}>
                    {this.textParser}
                </T>
            ]
        };

        if (config.whiteLabel.name === 'medcryptor') {
            obj.description.splice(
                1,
                0,
                <T key="new-chat-offer-patient" k="mcr_title_offerNewPatient">
                    {this.textParser}
                </T>
            );
        }

        return obj;
    }

    get chatEditor() {
        const page = {
            displayName: (chat: Chat) => {
                return chat.name;
            },
            saveNameChanges: (val: string): Promise<void | [void, void]> => {
                if (!chatStore.activeChat) return Promise.resolve();
                return chatStore.activeChat.rename(val);
            }
        };

        if (config.whiteLabel.name === 'medcryptor') {
            if (chatStore.activeChat.isInSpace && User.current.isMCAdmin) {
                page.displayName = (chat: Chat) => {
                    return chat.nameInSpace;
                };

                page.saveNameChanges = async (val: string) => {
                    if (!chatStore.activeChat) return Promise.resolve();
                    return Promise.all([
                        chatStore.activeChat.renameInSpace(val),
                        chatStore.activeChat.rename(`${chatStore.spaces.currentSpaceName} - ${val}`)
                    ]);
                };
            }
        }

        return page;
    }

    get chatView() {
        const obj = {
            title: name => <div className="title-content">{name}</div>,
            currentContext: null,
            checkActiveSpace: () => {
                return null;
            }
        };

        if (config.whiteLabel.name === 'medcryptor') {
            // MC admin sees room type in brackets next to room namem, at the top of ChatView
            if (chatStore.activeChat && chatStore.activeChat.isInSpace && User.current.isMCAdmin) {
                obj.title = name => {
                    return (
                        <div className="title-content">
                            {name}&nbsp; (
                            <T
                                k={
                                    chatStore.spaces.isPatientRoomOpen
                                        ? 'mcr_title_patientRoom'
                                        : 'mcr_title_internalRoom'
                                }
                            />
                            )
                        </div>
                    );
                };
            }

            if (chatStore.activeChat && chatStore.activeChat.isInSpace) {
                obj.currentContext = chatStore.spaces.currentRoomType;
            }

            obj.checkActiveSpace = () => {
                if (
                    chatStore.spaces.activeSpaceId &&
                    routerStore.currentRoute === routerStore.ROUTES.chats
                ) {
                    routerStore.navigateTo(routerStore.ROUTES.patients);
                }
            };
        }

        return obj;
    }

    get chatList() {
        const obj = {
            allRooms: chatStore.allRooms
        };

        if (config.whiteLabel.name === 'medcryptor') {
            obj.allRooms = chatStore.nonSpaceRooms;
        }

        return obj;
    }

    get channelSideBar() {
        const obj = {
            canILeave: chatCanILeave => chatCanILeave
        };

        if (
            config.whiteLabel.name === 'medcryptor' &&
            User.current.isMCAdmin &&
            routerStore.isPatientSpace
        ) {
            obj.canILeave = () => false;
        }

        return obj;
    }

    get membersSection() {
        const itemMakeAdmin = {
            key: 'member-menu-make-admin',
            value: 'make_admin',
            icon: 'account_balance',
            caption: 'button_makeAdmin',
            onClick: 'makeAdmin'
        };

        const itemDeleteMember = {
            key: 'member-menu-delete',
            value: 'delete',
            icon: 'remove_circle_outline',
            caption: 'button_remove',
            onClick: 'deleteParticipant'
        };

        if (
            config.whiteLabel.name === 'medcryptor' &&
            User.current.isMCAdmin &&
            routerStore.isPatientSpace
        ) {
            return {
                userMenuItems: username => {
                    if (contactStore.whitelabel.checkMCDoctor(username)) {
                        return [itemDeleteMember];
                    }
                    return [itemMakeAdmin, itemDeleteMember];
                }
            };
        }

        return {
            userMenuItems: () => [itemMakeAdmin, itemDeleteMember]
        };
    }

    get loading() {
        const obj = {
            // Ordinarily, just go to the chats view to see the activeChat
            goToActiveChat: () => {
                routerStore.navigateTo(routerStore.ROUTES.chats);
            }
        };

        if (config.whiteLabel.name === 'medcryptor') {
            // In MC, need to check if activeChat is in patient space, and activate that space if so.
            obj.goToActiveChat = () => {
                if (chatStore.activeChat && chatStore.activeChat.isInSpace) {
                    chatStore.spaces.activeSpaceId = chatStore.activeChat.chatHead.spaceId;
                    routerStore.navigateTo(routerStore.ROUTES.patients);
                } else if (chatStore.spaces.activeSpaceId) {
                    routerStore.navigateTo(routerStore.ROUTES.patients);
                } else {
                    routerStore.navigateTo(routerStore.ROUTES.chats);
                }
            };
        }

        return obj;
    }
}

export default new ELEMENTS();
