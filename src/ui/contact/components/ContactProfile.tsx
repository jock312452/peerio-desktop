import React from 'react';
import { observer } from 'mobx-react';
import { Avatar, Button, Dialog, ProgressBar } from 'peer-ui';
import { contactStore, chatStore, t } from 'peerio-icebear';
import { Contact } from 'peerio-icebear/dist/models';
import routerStore from '~/stores/router-store';
import T from '~/ui/shared-components/T';

const ContactProfileFingerprint = observer(({ contact }) => {
    const f = contact.fingerprint.split('-');
    return (
        <div className="contact-fingerprint row">
            <div className="list-title"> {t('title_publicKey')}</div>
            <div className="monospace selectable">
                {f[0]} {f[1]} {f[2]}
            </div>
            <div className="monospace selectable">
                {f[3]} {f[4]} {f[5]}
            </div>
        </div>
    );
});

interface ContactProfileProps {
    active: boolean;
    onCancel?: () => void;
    contact: Contact;
    onClose?: () => void;
}

@observer
class ContactProfileBody extends React.Component<ContactProfileProps> {
    startChat = () => {
        chatStore.startChat([this.props.contact]);
        routerStore.navigateTo(routerStore.ROUTES.chats);
        if (this.props.onClose) this.props.onClose();
    };

    removeContact = () => {
        contactStore.removeContact(this.props.contact);
    };

    addContact = () => {
        contactStore.addContact(this.props.contact);
    };

    render() {
        const c = this.props.contact;
        if (!c) return null;

        if (c.loading) {
            return (
                <div className="contact-profile">
                    <div className="row loading">
                        <ProgressBar circular />
                    </div>
                </div>
            );
        }

        if (c.notFound) {
            return (
                <div className="contact-profile">
                    <div className="row notfound">{t('error_usernameNotFound')}</div>
                </div>
            );
        }

        return (
            <div className="contact-profile">
                {c.tofuError ? (
                    <div className="contact-error">
                        {t('error_contactFingerprintChangedDetail')}
                    </div>
                ) : null}
                <div className="contact-avatar-info">
                    <Avatar contact={c} size="full" />
                    <div className="account-profile-container">
                        {c.isDeleted ? (
                            <T k="title_accountDeleted" className="deleted-account" tag="div" />
                        ) : null}
                        <div className="full-name selectable">
                            {c.firstName} {c.lastName}
                        </div>
                        <div className="username selectable">{c.username}</div>
                        <ContactProfileFingerprint contact={c} />
                    </div>
                </div>
                <div className="row profile-actions-container">
                    <div className="profile-actions">
                        {c.isDeleted ? null : (
                            <Button
                                tooltip={t('title_haveAChat')}
                                icon="forum"
                                onClick={this.startChat}
                                theme="no-hover"
                            />
                        )}
                        {c.isAdded ? (
                            <Button
                                icon="star"
                                tooltip={t('button_removeFavourite')}
                                onClick={this.removeContact}
                                theme="no-hover"
                                className="gold"
                            />
                        ) : (
                            <Button
                                icon="star_outline"
                                tooltip={t('button_addFavourite')}
                                onClick={this.addContact}
                                theme="no-hover"
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

@observer
export default class ContactProfile extends React.Component<ContactProfileProps> {
    render() {
        return (
            <Dialog
                title={t('title_settingsProfile')}
                active={this.props.active}
                onCancel={this.props.onCancel}
                actions={[{ label: t('button_close'), onClick: this.props.onCancel }]}
            >
                <ContactProfileBody {...this.props} />
            </Dialog>
        );
    }
}
