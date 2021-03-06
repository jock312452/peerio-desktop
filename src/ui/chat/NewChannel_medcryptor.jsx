/*
    NOTE: this component encompasses the Medcryptor version of NewChannel view
    as well as new patient space, new patient room, and new internal room
*/

import React from 'react';
import { observable, when } from 'mobx';
import { observer } from 'mobx-react';
import { chatStore, config, t } from 'peerio-icebear';
import UserPicker from '~/ui/shared-components/UserPicker';
import T from '~/ui/shared-components/T';
import { Input, ProgressBar } from 'peer-ui';
import ELEMENTS from '~/whitelabel/helpers/elements';
import STRINGS from '~/whitelabel/helpers/strings';
import routerStore from '~/stores/router-store';

@observer
class NewChannel extends React.Component {
    @observable waiting = false;
    @observable channelName = '';
    @observable purpose = '';

    handleAccept = () => {
        this.waiting = true;
        this[ELEMENTS.newChannel.acceptFunction]();
    };

    navigateWhenReady = (chat, route) => {
        if (!chat) {
            this.waiting = false;
            return;
        }
        when(
            () => chat.added === true,
            () => {
                routerStore.navigateTo(route);
            }
        );
    };

    createNewChannel = async () => {
        const chat = await chatStore.startChat(
            this.userPicker.selected,
            true,
            this.channelName,
            this.purpose
        );
        this.navigateWhenReady(chat, routerStore.ROUTES.chats);
    };

    createNewPatientSpace = async () => {
        const newSpaceProperties = {
            spaceId: null,
            spaceName: this.channelName,
            spaceDescription: ''
        };

        const patientRoom = await chatStore.spaces.createRoomInSpace(
            newSpaceProperties,
            t('mcr_title_consultation'),
            'patient',
            this.userPicker.selected
        );
        const internalRoom = await chatStore.spaces.createRoomInSpace(
            newSpaceProperties,
            t('mcr_title_general'),
            'internal',
            []
        );

        if (!internalRoom || !patientRoom) {
            this.waiting = false;
            return;
        }

        when(
            () => internalRoom.added && patientRoom.added,
            () => {
                this.waiting = false;

                const created = chatStore.spaces.spacesList.find(
                    x => x.spaceName === newSpaceProperties.spaceName
                );
                created.isNew = true;
                internalRoom.isNew = true;
                patientRoom.isNew = true;
            }
        );
    };

    createNewInternalRoom = () => {
        this.createRoomInPatientSpace('internal');
    };
    createNewPatientRoom = () => {
        this.createRoomInPatientSpace('patient');
    };

    createRoomInPatientSpace = async type => {
        const chat = await chatStore.spaces.createRoomInSpace(
            chatStore.spaces.currentSpace,
            this.channelName,
            type,
            this.userPicker.selected
        );
        this.navigateWhenReady(chat, routerStore.ROUTES.patients);
    };

    handleNameChange = val => {
        this.channelName = val;
    };

    handlePurposeChange = val => {
        this.purpose = val;
    };

    setUserPickerRef = ref => {
        this.userPicker = ref;
    };

    render() {
        if (this.waiting) {
            return (
                <div className="new-channel create-new-chat">
                    <div className="create-channel-loading">
                        <ProgressBar circular />
                    </div>
                </div>
            );
        }
        return (
            <div className="new-channel create-new-chat">
                <div className="chat-creation-header">
                    <div className="title">{ELEMENTS.newChannel.title}</div>
                    <div className="description">{ELEMENTS.newChannel.description}</div>
                </div>
                <div className="new-channel-inputs">
                    <div className="message-search-wrapper-new-channel message-search-wrapper">
                        <Input
                            placeholder={t(STRINGS.newChannel.channelName)}
                            value={this.channelName}
                            onChange={this.handleNameChange}
                            maxLength={config.chat.maxChatNameLength}
                            noHelperText
                        />
                        <div className="helper-text" />
                    </div>
                    {routerStore.isPatientSpace || routerStore.isNewPatient ? null : (
                        <div className="message-search-wrapper-new-channel message-search-wrapper">
                            <Input
                                placeholder={t(STRINGS.newChannel.channelPurpose)}
                                value={this.purpose}
                                onChange={this.handlePurposeChange}
                                maxLength={config.chat.maxChatPurposeLength}
                                autoFocus
                                noHelperText
                            />
                            <T
                                k={STRINGS.newChannel.purposeHelper}
                                tag="div"
                                className="helper-text"
                            />
                        </div>
                    )}
                    <div className="user-picker-container">
                        <UserPicker
                            ref={this.setUserPickerRef}
                            title={t(STRINGS.newChannel.userPickerTitle)}
                            noHeader
                            onlyPick
                            noAutoFocus
                            onAccept={this.handleAccept}
                            noSubmit={!this.channelName.length}
                            context={ELEMENTS.newChannel.context}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default NewChannel;
