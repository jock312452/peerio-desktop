import React from 'react';
import { observer } from 'mobx-react';
import { action, observable } from 'mobx';
import css from 'classnames';

import { t, LocalizationStrings } from 'peerio-icebear';
import { Button, Divider, MaterialIcon } from 'peer-ui';

import * as telemetry from '~/telemetry';

import routerStore from '~/stores/router-store';
import { saveAkPdf } from '~/helpers/account-key';

import T from '~/ui/shared-components/T';
import FileSpriteIcon from '~/ui/shared-components/FileSpriteIcon';
import LegalDialog from '~/ui/shared-components/LegalDialog';

import { SignupStep } from './SignupStepTypes';

const telemetryObject = { location: 'ONBOARDING', sublocation: 'TOP_DRAWER' };

interface TermsItem {
    icon?: string;
    spriteIcon?: string;
    titleLeft: keyof LocalizationStrings;
    titleRight?: keyof LocalizationStrings;
    textContent: {
        heading: keyof LocalizationStrings | null;
        paragraph: keyof LocalizationStrings;
    }[];
}

const termsTextContent: TermsItem[] = [
    {
        icon: 'help_outline',
        titleLeft: 'title_termsDataCollection',
        titleRight: 'title_termsDataCollection',
        textContent: [
            {
                heading: null,
                paragraph: 'title_termsDataCollectionIntro'
            },
            {
                heading: 'title_metadata',
                paragraph: 'title_termsMetadataParagraph'
            },
            {
                heading: 'title_accountInformation',
                paragraph: 'title_termsAccountInfoParagraph'
            },
            {
                heading: 'title_ipAddress',
                paragraph: 'title_termsIpParagraph'
            }
        ]
    },
    {
        icon: 'settings',
        titleLeft: 'title_termsDataThirdParty',
        titleRight: 'title_termsDataThirdParty',
        textContent: [
            {
                heading: 'title_service',
                paragraph: 'title_termsServiceParagraph'
            },
            {
                heading: 'title_communications',
                paragraph: 'title_termsCommunicationsParagraph'
            },
            {
                heading: 'title_analytics',
                paragraph: 'title_termsAnalyticsParagraph'
            }
        ]
    },
    {
        spriteIcon: 'txt',
        titleLeft: 'title_termsMainPoints',
        textContent: [
            {
                heading: null,
                paragraph: 'title_termsIntro'
            },
            {
                heading: 'title_content',
                paragraph: 'title_termsContentParagraph'
            },
            {
                heading: 'title_behaviour',
                paragraph: 'title_termsBehaviourParagraph'
            },
            {
                heading: 'title_security',
                paragraph: 'title_termsSecurityParagraph'
            }
        ]
    }
];

@observer
export default class TermsOfUse extends React.Component<SignupStep> {
    @observable termsStartTime: number;

    componentDidMount() {
        this.termsStartTime = Date.now();
    }

    akDownload = async () => {
        telemetry.shared.downloadAk(telemetryObject);
        await saveAkPdf(this.props.store, telemetryObject);

        // NOTICE: user can press cancel and this flag would still be set to true
        this.props.store.keyBackedUp = true;
    };

    get akBackupReminder() {
        return (
            <div className="ak-backup-reminder">
                <div className="title">
                    <MaterialIcon icon="get_app" />
                    <T k="title_backupAk" />
                </div>
                <div className="description">
                    <T k="title_backupAkReminder" />
                    <Button onClick={this.akDownload} label={t('button_backupNow')} />
                </div>
            </div>
        );
    }

    // Term content itself
    @observable selectedTerm = -1;
    @action.bound
    selectTerm(index: number) {
        this.selectedTerm = index;
        telemetry.signup.readMore(t(termsTextContent[this.selectedTerm].titleLeft) as string);
    }

    get termsItems() {
        const left = [];
        const right = [];

        termsTextContent.forEach((term, index) => {
            const isSelected = this.selectedTerm === index;

            left.push(
                // eslint-disable-next-line react/no-array-index-key
                <React.Fragment key={`terms-entry-${index}`}>
                    <div
                        className={css('terms-entry', 'clickable', {
                            selected: isSelected
                        })}
                        onClick={() => this.selectTerm(index)}
                    >
                        {term.spriteIcon ? (
                            <FileSpriteIcon type={term.spriteIcon} size="small" />
                        ) : null}
                        {term.icon ? <MaterialIcon icon={term.icon} /> : null}
                        <span className="question">{t(term.titleLeft)}</span>
                        <MaterialIcon className="right-arrow" icon="keyboard_arrow_right" />
                        <MaterialIcon
                            className={css('left-arrow', {
                                banish: !isSelected
                            })}
                            icon="play_arrow"
                        />
                    </div>
                    <Divider
                        // eslint-disable-next-line react/no-array-index-key
                        key={`divider-${index}`}
                    />
                </React.Fragment>
            );

            right.push(
                <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={`terms-text-${index}`}
                    className={css('terms-text', {
                        selected: isSelected
                    })}
                >
                    {term.titleRight ? <h3>{t(term.titleRight)}</h3> : null}
                    {term.textContent.map((content, i) => {
                        return (
                            // eslint-disable-next-line react/no-array-index-key
                            <React.Fragment key={`textcontent-${i}`}>
                                {content.heading ? (
                                    <h4 className="question">{t(content.heading)}</h4>
                                ) : null}
                                <p>{t(content.paragraph)}</p>
                            </React.Fragment>
                        );
                    })}
                </div>
            );
        });

        return { left, right };
    }

    @observable cancelTermsStartTime: number;
    @observable termsDeclined = false;

    @action.bound
    declineTerms() {
        telemetry.signup.declineTerms();
        telemetry.signup.durationTerms(this.termsStartTime);
        this.termsDeclined = true;
        this.cancelTermsStartTime = Date.now();
    }

    acceptTerms = () => {
        telemetry.signup.acceptTerms();
        telemetry.signup.durationTerms(this.termsStartTime);
        this.props.onComplete();
    };

    @action.bound
    backToTerms() {
        telemetry.signup.durationCancelTerms(this.cancelTermsStartTime);
        this.termsStartTime = Date.now();
        this.termsDeclined = false;
    }

    // "Confirm cancellation" page
    confirmCancel = () => {
        telemetry.signup.confirmDeclineTerms();
        telemetry.signup.durationCancelTerms(this.cancelTermsStartTime);
        routerStore.navigateTo(routerStore.ROUTES.newUser);
    };

    get confirmCancelPage() {
        return (
            <div className="cancel-signup real-ui-container">
                <div className="real-ui-content-container">
                    <T k="title_cancelSignup" tag="div" className="heading" />
                    <T k="title_declineExplanation" tag="p" />

                    <T k="title_whyRequired" tag="div" className="subheading" />
                    <T k="title_whyRequiredExplanation" tag="p">
                        {{
                            openPrivacy: (text: string) => {
                                return (
                                    <Button onClick={this.showPrivacyDialog} theme="link">
                                        {text}
                                    </Button>
                                );
                            },
                            openTerms: (text: string) => {
                                return (
                                    <Button onClick={this.showTermsDialog} theme="link">
                                        {text}
                                    </Button>
                                );
                            }
                        }}
                    </T>

                    <T k="title_signupAgain" tag="div" className="subheading" />
                    <T k="title_signupAgainExplanation" tag="p" />

                    <div className="buttons-container">
                        <Button onClick={this.confirmCancel} label={t('button_confirmCancel')} />
                        <Button
                            onClick={this.backToTerms}
                            theme="affirmative"
                            label={t('button_goBack')}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Legal dialog for displaying full Terms of Use, Privacy Policy
    @observable legalDialogRef = React.createRef<LegalDialog>();

    showLegalDialog = (dialogType: string): void => {
        this.legalDialogRef.current.content = dialogType;
        this.legalDialogRef.current.showDialog();
    };

    @action.bound
    showTermsDialog() {
        this.showLegalDialog('terms');
        telemetry.signup.openTermsDialog();
    }

    @action.bound
    showPrivacyDialog() {
        this.showLegalDialog('privacy');
        telemetry.signup.openPrivacyDialog();
    }

    render() {
        if (this.termsDeclined)
            return (
                <React.Fragment>
                    {this.confirmCancelPage}
                    <LegalDialog ref={this.legalDialogRef} />
                </React.Fragment>
            );

        return (
            <div className="terms-of-use">
                {!this.props.store.keyBackedUp ? this.akBackupReminder : null}

                <div className="real-ui-container">
                    <div className="real-ui-content-container">
                        <div className="heading">{t('title_termsOfUseSentenceCase')}</div>
                        <T k="title_termsDescription" tag="p">
                            {{
                                openTerms: text => {
                                    return (
                                        <Button onClick={this.showTermsDialog} theme="link">
                                            {text}
                                        </Button>
                                    );
                                },
                                openPrivacy: text => {
                                    return (
                                        <Button onClick={this.showPrivacyDialog} theme="link">
                                            {text}
                                        </Button>
                                    );
                                }
                            }}
                        </T>
                        <div className="terms-left">{this.termsItems.left}</div>
                        <div className="buttons-container">
                            <Button onClick={this.declineTerms} label={t('button_decline')} />
                            <Button
                                testId="button_accept"
                                onClick={this.acceptTerms}
                                theme="affirmative"
                                label={t('button_accept')}
                            />
                        </div>
                    </div>
                </div>

                <div
                    className={css('mock-ui-container', {
                        hide: this.selectedTerm === -1
                    })}
                >
                    <div className="terms-right">{this.termsItems.right}</div>
                </div>

                <LegalDialog ref={this.legalDialogRef} />
            </div>
        );
    }
}
