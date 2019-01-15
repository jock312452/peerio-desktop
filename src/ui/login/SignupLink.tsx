import { login } from '~/telemetry';
import React from 'react';
import { Link } from 'react-router';
import T from '~/ui/shared-components/T';
import { t } from 'peerio-icebear';
import { observer } from 'mobx-react';

@observer
export default class SignupLink extends React.Component {
    render() {
        return (
            <div className="signup-link">
                <T k="title_newToApp">{{ appName: t('title_appName') }}</T>&nbsp;
                <Link onClick={login.navToCreateAccount} to="/signup">
                    {t('button_CreateAccount')}
                </Link>
            </div>
        );
    }
}
