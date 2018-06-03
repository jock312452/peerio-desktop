const React = require('react');
const { computed, when } = require('mobx');
const { observer } = require('mobx-react');

const routerStore = require('~/stores/router-store');

const css = require('classnames');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');
const FlipMove = require('react-flip-move');
const { Button, List, ListItem } = require('peer-ui');
const PlusIcon = require('~/ui/shared-components/PlusIcon');
const { chatStore, chatInviteStore } = require('peerio-icebear');
const { getAttributeInParentChain } = require('~/helpers/dom');

@observer
class PatientSidebar extends React.Component {
    componentWillMount() {
        if (this.space.isNew) {
            this.space.isNew = false;
        }
        this.disposer = when(() => this.spaceDeleted, this.goBack);
    }

    componentWillUnmount() {
        this.disposer();
    }

    @computed get spaceDeleted() {
        return !this.space;
    }

    get space() { return chatStore.spaces.find(x => x.spaceId === chatStore.activeSpace); }
    get isNewInternalRoom() { return routerStore.currentRoute === routerStore.ROUTES.newInternalRoom; }
    get isPatientSpaceRoom() { return routerStore.currentRoute === routerStore.ROUTES.newPatientRoom; }

    goBack() {
        chatStore.deactivateCurrentChat();
        chatStore.activeSpace = null;
        routerStore.navigateTo(routerStore.ROUTES.chats);
    }

    newInternalRoom = () => {
        chatStore.deactivateCurrentChat();
        routerStore.navigateTo(routerStore.ROUTES.newInternalRoom);
    }

    newPatientRoom = () => {
        chatStore.deactivateCurrentChat();
        routerStore.navigateTo(routerStore.ROUTES.newPatientRoom);
    }

    activateChat = async (ev) => {
        chatInviteStore.deactivateInvite();
        const id = getAttributeInParentChain(ev.target, 'data-chatid');
        chatStore.chats.find(x => x.id === id).isNew = false;
        chatStore.activate(id);
        routerStore.navigateTo(routerStore.ROUTES.patients);
    }

    calculateRightContent = (r) => {
        if (r.isNew) {
            return (<T k="title_new" className="badge-new" />);
        } else if ((!r.active || r.newMessagesMarkerPos) && r.unreadCount > 0) {
            return (<div className="notification">{r.unreadCount < 100 ? r.unreadCount : '99+'}</div>);
        }

        return null;
    }

    @computed get internalRoomMap() {
        const internalRooms = this.space.internalRooms;

        return internalRooms.map(r => {
            return (
                <ListItem
                    data-chatid={r.id}
                    key={r.id || r.tempId}
                    className={
                        css('room-item',
                            {
                                active: r.active,
                                unread: r.unreadCount > 0
                            }
                        )
                    }
                    caption={`# ${r.chatHead.nameInSpace}`}
                    onClick={this.activateChat}
                    rightContent={this.calculateRightContent(r)}
                />
            );
        });
    }

    @computed get patientRoomMap() {
        const patientRooms = this.space.patientRooms;

        return patientRooms.map(c => {
            c.isEmpty = c.otherParticipants.length === 0;
            return (
                <ListItem
                    data-chatid={c.id}
                    key={c.id || c.tempId}
                    className={css(
                        'dm-item',
                        {
                            active: c.active,
                            unread: c.unreadCount > 0,
                            pinned: c.isFavorite
                        }
                    )}
                    leftContent={<div className="new-dm-avatar material-icons">
                        {c.isEmpty
                            ? 'help_outline'
                            : 'people'
                        }
                    </div>}

                    onClick={this.activateChat}
                    rightContent={this.calculateRightContent(c)}
                >
                    {c.isEmpty
                        ? <T k="title_noParticipants" />
                        : c.chatHead.nameInSpace
                    }
                </ListItem>
            );
        });
    }

    render() {
        return (
            <div className="feature-navigation-list messages-list patient-sidebar">
                <div className="list">
                    <div className="navigate-back"><Button onClick={this.goBack} icon="arrow_back" /></div>
                    <div className="patient-name">{this.space.spaceName}</div>

                    <List clickable>
                        <div>
                            <PlusIcon onClick={this.newInternalRoom} label={t('mcr_title_internalRooms')} />
                            {/* <Tooltip text={t('title_addDirectMessage')} position="right" /> */}
                        </div>
                        <FlipMove duration={200} easing="ease-in-out">
                            {this.isNewInternalRoom &&
                                <ListItem key="new chat"
                                    className={css(
                                        'room-item', 'new-room-list-entry',
                                        { active: this.isNewInternalRoom }
                                    )}
                                    leftContent={<div className="new-dm-avatar material-icons">help_outline</div>}
                                >
                                    <i>{t('title_newDirectMessage')}</i>
                                </ListItem>
                            }
                            {this.internalRoomMap}
                        </FlipMove>
                    </List>

                    <List clickable>
                        <div>
                            <PlusIcon onClick={this.newPatientRoom} label={t('mcr_title_patientRooms')} />
                            {/* <Tooltip text={t('title_addDirectMessage')} position="right" /> */}
                        </div>
                        <FlipMove duration={200} easing="ease-in-out">
                            {this.isPatientSpaceRoom &&
                                <ListItem key="new chat"
                                    className={css(
                                        'dm-item', 'new-dm-list-entry',
                                        { active: this.isPatientSpaceRoom }
                                    )}
                                    leftContent={<div className="new-dm-avatar material-icons">help_outline</div>}
                                >
                                    <i>{t('title_newDirectMessage')}</i>
                                </ListItem>
                            }
                            {this.patientRoomMap}
                        </FlipMove>
                    </List>
                </div>
            </div>
        );
    }
}

module.exports = PatientSidebar;
