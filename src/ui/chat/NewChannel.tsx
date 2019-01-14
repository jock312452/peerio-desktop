import React from 'react';
import { observable, when } from 'mobx';
import { observer } from 'mobx-react';
import { chatStore, config, User, t } from 'peerio-icebear';
import UserPicker from '~/ui/shared-components/UserPicker';
import T from '~/ui/shared-components/T';
import { Input, ProgressBar } from 'peer-ui';

@observer
export default class NewChannel extends React.Component {
    /**
     * UI "waiting" state after starting a new chat.
     * Shows a loading spinner if true.
     */
    @observable waiting = false;

    /** The name that the Room will be given. */
    @observable channelName = '';

    /** "Purpose" field of the new Room. */
    @observable purpose = '';

    // componentDidMount() {
    //     if (this.isLimitReached) this.upgradeDialog.show();
    // }

    get isLimitReached() {
        return User.current.channelsLeft === 0;
    }

    handleAccept = async () => {
        this.waiting = true;
        const chat = await chatStore.startChat(
            this.userPickerRef.current.selected,
            true,
            this.channelName,
            this.purpose
        );
        if (!chat) {
            this.waiting = false;
            return;
        }
        when(
            () => chat.added === true,
            () => {
                window.router.push('/app/chats');
            }
        );
    };

    gotoNewChat() {
        window.router.push('/app/chats/new-chat');
    }

    handleNameChange = (val: string) => {
        this.channelName = val;
    };

    handlePurposeChange = (val: string) => {
        this.purpose = val;
    };

    userPickerRef = React.createRef<UserPicker>();

    // setUpgradeDialogRef = ref => {
    //     this.upgradeDialog = ref;
    // };

    render() {
        const textParser = {
            toCreateDM: (text: string) => (
                <a className="clickable" onClick={this.gotoNewChat}>
                    {text}
                </a>
            )
        };

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
                    <div className="title">
                        <T k="title_createChannel" tag="span" />
                    </div>
                    <div className="description">
                        <T k="title_createChannelDetails" />
                        <T k="title_offerNewDM">{textParser}</T>
                    </div>
                </div>
                <div className="new-channel-inputs">
                    <div className="message-search-wrapper-new-channel message-search-wrapper">
                        <Input
                            placeholder={t('title_channelName')}
                            value={this.channelName}
                            onChange={this.handleNameChange}
                            maxLength={config.chat.maxChatNameLength}
                            size="small"
                            autoFocus
                            noHelperText
                            testId="input_roomName"
                        />
                        <div className="helper-text" />
                    </div>
                    <div className="message-search-wrapper-new-channel message-search-wrapper">
                        <Input
                            placeholder={t('title_purpose')}
                            value={this.purpose}
                            onChange={this.handlePurposeChange}
                            maxLength={config.chat.maxChatPurposeLength}
                            size="small"
                            noHelperText
                        />
                        <T k="title_optional" tag="div" className="helper-text" />
                    </div>
                    <div className="user-picker-container">
                        <UserPicker
                            ref={this.userPickerRef}
                            title={t('title_chatWith')}
                            noHeader
                            onlyPick
                            noAutoFocus
                            onAccept={this.handleAccept}
                            noSubmit={!this.channelName.length}
                        />
                    </div>
                </div>
                {/* <ChannelUpgradeDialog ref={this.setUpgradeDialogRef} /> */}
            </div>
        );
    }
}
