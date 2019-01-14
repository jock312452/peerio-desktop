import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';
import { t } from 'peerio-icebear';
import { Button, MaterialIcon, RadioButtons } from 'peer-ui';
import uiStore from '~/stores/ui-store';
import routerStore from '~/stores/router-store';
import T from '~/ui/shared-components/T';

const ALL_CONTACTS = 'all_contacts';
const FAV_CONTACTS = 'fav_contacts';
const DISABLED = 'disabled';

@observer
class UrlPreviewConsent extends React.Component {
    /** User's selected setting, with default set to "all contacts" */
    @observable selectedMode = ALL_CONTACTS;

    /**
     * After submitting consent: is this the first time the user has saved
     * this setting? If so, we display a prompt to user reminding them that
     * they can change the setting at any time.
     */
    @observable firstSave = false;

    radioOptions = [
        { value: ALL_CONTACTS, label: t('title_forAllContacts') },
        { value: FAV_CONTACTS, label: t('title_forFavouriteContactsOnly') },
        { value: DISABLED, label: t('title_disable') }
    ];

    onSelectedModeChange = (value: string) => {
        this.selectedMode = value;
    };

    onDismiss = () => {
        this.selectedMode = DISABLED;
        this.onSubmitConsent();
    };

    onSubmitConsent = () => {
        this.firstSave = true;
        uiStore.prefs.externalContentConsented = true;
        switch (this.selectedMode) {
            case ALL_CONTACTS:
                uiStore.prefs.externalContentEnabled = true;
                uiStore.prefs.externalContentJustForFavs = false;
                break;
            case FAV_CONTACTS:
                uiStore.prefs.externalContentEnabled = true;
                uiStore.prefs.externalContentJustForFavs = true;
                break;
            default:
                uiStore.prefs.externalContentEnabled = false;
                break;
        }
    };

    goToSettings = () => {
        routerStore.navigateTo(routerStore.ROUTES.prefs);
    };

    render() {
        // need to erase this for now bc urlData is empty, which iss the reason for shifting consent to new component
        // const urlData = this.props.urlData;

        const textParser = {
            toSettings: text => (
                <a className="clickable" onClick={this.goToSettings}>
                    {text}
                </a>
            )
        };

        return (
            <div className="url-consent first-time">
                <div className="warning-header">
                    <MaterialIcon icon="security" />
                    <T k="title_EnableUrlPreviews" className="text" />
                </div>
                <div className="warning-body">
                    <p className="text">
                        <T k="title_UrlPreviewsWarning2" />
                        &nbsp;
                        <T k="title_learnMore" />
                    </p>
                    <RadioButtons
                        value={this.selectedMode}
                        onChange={this.onSelectedModeChange}
                        options={this.radioOptions}
                    />
                    <div className="buttons-container">
                        <Button
                            label={t('button_notNow')}
                            onClick={this.onDismiss}
                            theme="secondary"
                        />
                        <Button label={t('button_save')} onClick={this.onSubmitConsent} />
                    </div>
                </div>
                {this.firstSave && (
                    <div
                        className={css('update-settings', {
                            nomargin: !uiStore.prefs.externalContentEnabled
                        })}
                    >
                        <MaterialIcon icon="check_circle" />
                        <T k="title_updateSettingsAnyTime" className="text">
                            {textParser}
                        </T>
                    </div>
                )}
            </div>
        );
    }
}

export default UrlPreviewConsent;
