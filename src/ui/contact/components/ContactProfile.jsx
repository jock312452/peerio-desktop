const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { ProgressBar, TooltipIconButton } = require('~/react-toolbox');
const { contactStore, chatStore } = require('peerio-icebear');
const { t } = require('peerio-translator');
const routerStore = require('~/stores/router-store');
const T = require('~/ui/shared-components/T');

@observer
class ContactProfile extends React.Component {
    @observable contact;
    componentWillMount() {
        this.contact = contactStore.getContact(this.props.username);
    }
    componentWillReceiveProps(next) {
        this.contact = contactStore.getContact(next.username);
    }
    startChat = () => {
        chatStore.startChat([this.contact]);
        routerStore.navigateTo(routerStore.ROUTES.chats);
        if (this.props.onClose) this.props.onClose();
    };

    removeContact = () => {
        contactStore.removeContact(this.contact);
    };

    addContact = () => {
        contactStore.addContact(this.contact);
    };

    render() {
        const c = this.contact;
        if (!c) return null;
        if (c.loading) {
            return (
                <div className="contact-profile">
                    <div className="row loading">
                        <ProgressBar type="circular" mode="indeterminate" />
                    </div>
                </div>
            );
        }
        if (c.notFound) {
            return (
                <div className="contact-profile">
                    <div className="row notfound">
                        {t('error_usernameNotFound')}
                    </div>
                </div>
            );
        }
        const f = c.fingerprint.split('-');
        return (
            <div className="contact-profile">
                {c.tofuError
                    ? <div className="contact-error">
                        {t('error_contactFingerprintChangedDetail')}
                    </div>
                    : null}
                <div className="contact-avatar-info">
                    {/* TODO: can't use Avatar component here because it always has a ToolTip */}
                    <div className="avatar-wrapper">
                        <div className="rt-avatar-avatar avatar-container profile"
                            style={{ backgroundColor: !c.hasAvatar && c.color }} >
                            <div className="image-container">
                                {c.hasAvatar
                                    ? <img src={c.largeAvatarUrl} alt={c.username} />
                                    : c.letter
                                }
                            </div>
                        </div>
                    </div>
                    <div className="deleted-account-container">
                        {c.isDeleted ? <T k="title_accountDeleted" className="deleted-account" tag="div" /> : null}
                        <div className="title">{c.firstName} {c.lastName}</div>
                        <div>{c.usernameTag}</div>
                        <div className="row">
                            <div className="list-title"> {t('title_publicKey')}</div>
                            <div className="monospace selectable">{f[0]} {f[1]} {f[2]}</div>
                            <div className="monospace selectable">{f[3]} {f[4]} {f[5]}</div>
                        </div>
                    </div>
                </div>
                <div className="row profile-actions-container">
                    <div className="profile-actions">
                        {c.isDeleted
                            ? null
                            : <TooltipIconButton
                                tooltip={t('title_haveAChat')}
                                icon="forum"
                                onClick={this.startChat} />
                        }
                        {c.isAdded
                            ? <TooltipIconButton icon="star"
                                tooltip={t('button_removeFavourite')}
                                className="icon-gold"
                                onClick={this.removeContact} />
                            : <TooltipIconButton icon="star_outline"
                                tooltip={t('button_addFavourite')}
                                onClick={this.addContact} />}
                    </div>
                </div>
            </div>
        );
    }
}


module.exports = ContactProfile;
