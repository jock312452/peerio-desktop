import React from 'react';
import { observable, when } from 'mobx';
import { observer } from 'mobx-react';
import { chatStore, contactStore, t } from 'peerio-icebear';
import UserPicker from '~/ui/shared-components/UserPicker';
import FullCoverLoader from '~/ui/shared-components/FullCoverLoader';
import BackgroundIllustration from '~/ui/shared-components/BackgroundIllustration';
import ELEMENTS from '~/whitelabel/helpers/elements';

@observer
class NewChat extends React.Component {
    @observable waiting = false;
    @observable picker;

    componentDidMount() {
        chatStore.deactivateCurrentChat();
    }

    handleAccept = async selected => {
        this.waiting = true;
        if (!selected.length || selected.filter(c => c.notFound).length) {
            this.waiting = false;
            return;
        }
        const chat = await chatStore.startChat(selected);
        if (!chat) {
            this.waiting = false;
            return;
        }
        when(
            () => chat.added === true,
            () => {
                this.waiting = false;
                window.router.push('/app/chats');
            }
        );
    };

    handleClose() {
        window.router.push('/app/chats');
    }

    render() {
        return (
            <div className="new-dm create-new-chat">
                <div className="user-picker-container">
                    <UserPicker
                        title={t('title_newDirectMessage')}
                        description={ELEMENTS.newChat.description}
                        limit={1}
                        onAccept={this.handleAccept}
                        onClose={this.handleClose}
                        isDM
                        context="newchat"
                    />
                </div>
                <FullCoverLoader show={this.waiting} />
                {contactStore.contacts.length === 0 ? (
                    <BackgroundIllustration
                        src="./static/img/illustrations/dm-start.svg"
                        height={320}
                        width={538}
                        distance={32}
                    />
                ) : null}
            </div>
        );
    }
}

export default NewChat;
