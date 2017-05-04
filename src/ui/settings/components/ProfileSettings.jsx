const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { Input, Button, TooltipIconButton, FontIcon, IconMenu, MenuItem, MenuDivider } = require('~/react-toolbox');
const { User, contactStore } = require('~/icebear');
const { t } = require('peerio-translator');
const BetterInput = require('~/ui/shared-components/BetterInput');

@observer
class Profile extends React.Component {
    @observable addMode = false;
    @observable newEmail = '';

    componentWillMount() {
        this.contact = contactStore.getContact(User.current.username);
    }

    saveFirstName(val) {
        const prev = User.current.firstName;
        User.current.firstName = val;
        User.current.saveProfile().catch(() => {
            User.current.firstName = prev;
        });
    }

    saveLastName(val) {
        const prev = User.current.lastName;
        User.current.lastName = val;
        User.current.saveProfile().catch(() => {
            User.current.lastName = prev;
        });
    }
    // ----- Emails -----
    switchToAddMode = () => {
        this.newEmail = '';
        this.addMode = true;
    };

    onNewEmailChange = val => {
        this.newEmail = val;
    };

    cancelNewEmail = () => {
        this.addMode = false;
        this.newEmail = '';
    };

    saveNewEmail = () => {
        User.current.addEmail(this.newEmail);
        this.addMode = false;
        this.newEmail = false;
    };

    removeEmail(email) {
        if (!confirm(`${t('title_confirmRemoveEmail')} ${email}`)) return;
        User.current.removeEmail(email);
    }

    resendConfirmation(email) {
        User.current.resendEmailConfirmation(email);
    }

    makePrimary(email) {
        User.current.makeEmailPrimary(email);
    }

    // ------ /Emails -----
    render() {
        const f = this.contact.fingerprint.split('-');
        const user = User.current;
        return (
            <section className="flex-row">
                <div>
                    <div className="input-row">
                        <BetterInput onAccept={this.saveFirstName}
                            label={t('title_firstName')}
                            value={user.firstName} />
                        <BetterInput onAccept={this.saveLastName}
                            label={t('title_lastName')}
                            value={user.lastName} />
                    </div>
                    <br /><br />
                    {
                        user.addresses.map(a => {
                            return (<div key={a.address} className="email-row">
                                {a.confirmed ? null : <div className="error">{t('error_unconfirmedEmail')}:</div>}
                                {a.primary && user.addresses.length > 1
                                    ? <span className="starred">★&nbsp;</span> : null}
                                {a.address}
                                <IconMenu icon="more_vert">
                                    {
                                        a.primary
                                            ? null
                                            : <MenuItem caption={t('button_makePrimary')} icon="star"
                                                onClick={() => { this.makePrimary(a.address); }} />
                                    }
                                    {
                                        a.confirmed
                                            ? null
                                            : <MenuItem caption={t('button_resend')} icon="mail"
                                                onClick={() => { this.resendConfirmation(a.address); }} />
                                    }
                                    {
                                        a.primary
                                            ? null
                                            : <MenuItem caption={t('button_delete')} icon="delete"
                                                onClick={() => { this.removeEmail(a.address); }} />
                                    }
                                </IconMenu>
                            </div>);
                        })
                    }
                    <br />
                    {
                        this.addMode
                            ? <div className="flex-row">
                                <Input type="email" label={t('title_email')} value={this.newEmail}
                                    onChange={this.onNewEmailChange} />
                                <TooltipIconButton tooltip={t('button_save')} icon="done"
                                    onClick={this.saveNewEmail} />
                                <TooltipIconButton tooltip={t('button_cancel')} icon="delete"
                                    onClick={this.cancelNewEmail} />
                            </div>
                            : null
                    }
                    {
                        this.addMode || user.addresses.length > 2
                            ? null
                            : <Button label={t('button_add')} onClick={this.switchToAddMode} raised primary />
                    }

                    <div className="row" style={{ marginTop: '40px' }} >
                        <div className="list-title" style={{ marginBottom: '8px' }}> {t('title_publicKey')}</div>
                        <div className="monospace selectable">{f[0]} {f[1]} {f[2]}</div>
                        <div className="monospace selectable">{f[3]} {f[4]} {f[5]}</div>
                    </div>
                    {/* <Button label={t('button_save')}
                            style={{ marginTop: '40px' }} primary raised /> */}
                </div>
                <div className="avatar-card"
                    style={{
                        backgroundColor: this.contact.color
                        // backgroundImage: this.avatarImage
                    }}>
                    <div className="avatar-card-user">
                        <div className="avatar-card-display-name">
                            {user.fullName}
                        </div>
                        <div className="avatar-card-username">
                            {user.username}
                        </div>
                    </div>
                    <div className="avatar-card-initial">
                        {/* {this.avatarImage ? '' : this.contact.letter} */}
                        {this.contact.letter}
                    </div>
                    <div className="card-footer">
                        {/* <IconButton icon="delete"
                                    className={css({ banish: !this.avatarImage })}
                                    onClick={this.handleDeleteAvatar} />
                        <IconButton icon="add_a_photo"
                                    onClick={this.handleAddAvatar} /> */}
                    </div>
                </div>
            </section>
        );
    }
}
module.exports = Profile;
