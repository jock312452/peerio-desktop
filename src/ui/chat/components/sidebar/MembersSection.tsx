import React from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { chatStore, contactStore, chatInviteStore, User, t } from 'peerio-icebear';
import { Contact, Chat } from 'peerio-icebear/dist/models';
import { Avatar, List, ListHeading, ListItem, Menu, MenuItem } from 'peer-ui';

import T from '~/ui/shared-components/T';
import ContactProfile from '~/ui/contact/components/ContactProfile';
import ELEMENTS from '~/whitelabel/helpers/elements';
import SideBarSection from './SideBarSection';

interface MembersSectionProps {
    open: boolean;
    onToggle: () => void;
    onAddParticipants: () => void;
}

@observer
export default class MembersSection extends React.Component<MembersSectionProps> {
    @observable.ref clickedContact: Contact | null = null;

    @observable contactProfileActive = false;

    @action.bound
    closeContactProfile() {
        this.contactProfileActive = false;
    }

    @action.bound
    openContactProfile(contact: Contact) {
        this.clickedContact = contact;
        this.contactProfileActive = true;
    }

    render() {
        const chat = chatStore.activeChat;
        if (!chat) return null;
        const invited = chatInviteStore.sent.get(chat.id);
        const { isChannel, canIAdmin } = chat;
        const showAdmin = isChannel && canIAdmin;

        if (!isChannel && !chat.otherParticipants.length) {
            // this removes member section from DM chat with self
            return null;
        }

        return (
            <SideBarSection
                title={t('title_Members')}
                onToggle={this.props.onToggle}
                open={this.props.open}
            >
                <div
                    className={css('member-list', 'scrollable', {
                        'with-admin-controls': isChannel && canIAdmin
                    })}
                >
                    {isChannel && canIAdmin ? (
                        <List className="action-list" clickable>
                            <ListItem
                                className="admin-controls"
                                leftIcon="person_add"
                                caption={t('button_inviteToChannel')}
                                onClick={this.props.onAddParticipants}
                            />
                        </List>
                    ) : null}
                    <List clickable>
                        {chat.allJoinedParticipants.map(c => (
                            <JoinedParticipant
                                key={c.username}
                                contact={c}
                                chat={chat}
                                showAdmin={showAdmin}
                                onClickContact={this.openContactProfile}
                            />
                        ))}
                        {invited && invited.length ? (
                            <ListHeading caption={t('title_invited')} />
                        ) : null}
                        {invited
                            ? invited.map(c => (
                                  <InvitedParticipant
                                      key={c.username}
                                      c={c}
                                      showAdmin={showAdmin}
                                      onClickContact={this.openContactProfile}
                                  />
                              ))
                            : null}
                    </List>
                </div>
                <ContactProfile
                    active={this.contactProfileActive}
                    onCancel={this.closeContactProfile}
                    contact={this.clickedContact}
                />
            </SideBarSection>
        );
    }
}

function stopPropagation(ev: React.MouseEvent) {
    ev.stopPropagation();
}

function deleteParticipant(username: string) {
    chatStore.activeChat.removeParticipant(username);
}

class AdminMenu extends React.Component<{ username: string }> {
    deleteParticipant = () => {
        deleteParticipant(this.props.username);
    };

    demoteAdmin = () => {
        chatStore.activeChat.demoteAdmin(contactStore.getContact(this.props.username));
    };

    render() {
        return (
            <Menu icon="more_vert" position="bottom-right" onClick={stopPropagation}>
                <MenuItem
                    value="demote_admin"
                    icon="highlight_off"
                    caption={t('button_demoteAdmin')}
                    onClick={this.demoteAdmin}
                />
                <MenuItem
                    value="delete"
                    icon="remove_circle_outline"
                    caption={t('button_remove')}
                    onClick={this.deleteParticipant}
                />
            </Menu>
        );
    }
}

class UserMenu extends React.Component<{ username: string }> {
    deleteParticipant = () => {
        deleteParticipant(this.props.username);
    };

    makeAdmin = () => {
        chatStore.activeChat.promoteToAdmin(contactStore.getContact(this.props.username));
    };

    render() {
        return (
            <Menu icon="more_vert" position="bottom-right" onClick={stopPropagation}>
                {ELEMENTS.membersSection.userMenuItems(this.props.username).map(item => (
                    <MenuItem
                        key={item.key}
                        value={item.value}
                        icon={item.icon}
                        caption={t(item.caption as any) as string}
                        onClick={this[item.onClick]} // FIXME: audit
                    />
                ))}
            </Menu>
        );
    }
}

class InviteMenu extends React.Component<{ username: string }> {
    deleteInvite = () => {
        chatInviteStore.revokeInvite(chatStore.activeChat.id, this.props.username);
    };

    render() {
        return (
            <Menu icon="more_vert" position="bottom-right" onClick={stopPropagation}>
                <MenuItem
                    icon="remove_circle_outline"
                    caption={t('button_remove')}
                    onClick={this.deleteInvite}
                />
            </Menu>
        );
    }
}

class JoinedParticipant extends React.Component<{
    contact: Contact;
    chat: Chat;
    showAdmin: boolean;
    onClickContact: (contact: Contact) => void;
}> {
    onClick = () => {
        this.props.onClickContact(this.props.contact);
    };

    render() {
        const { contact: c, chat, showAdmin } = this.props;

        return (
            <ListItem
                leftContent={<Avatar key="a" contact={c} size="small" clickable />}
                caption={c.fullName}
                legend={
                    <div className="user-caption">
                        <span className="username">{c.username}</span>
                        {chat.isAdmin(c) ? <T k="title_admin" className="tag" /> : null}
                    </div>
                }
                rightContent={
                    showAdmin && User.current.username !== c.username ? (
                        chat.isAdmin(c) ? (
                            <AdminMenu username={c.username} />
                        ) : (
                            <UserMenu username={c.username} />
                        )
                    ) : null
                }
                onClick={this.onClick}
            />
        );
    }
}

class InvitedParticipant extends React.Component<{
    c: { username: string; timestamp?: number };
    showAdmin: boolean;
    onClickContact: (contact: Contact) => void;
}> {
    onClick = () => {
        this.props.onClickContact(contactStore.getContact(this.props.c.username));
    };

    render() {
        const { c, showAdmin } = this.props;

        return (
            <ListItem
                caption={c.username}
                rightContent={showAdmin && <InviteMenu username={c.username} />}
                onClick={this.onClick}
            />
        );
    }
}
