import React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'peer-ui';
import { t } from 'peerio-translator';

@observer
export default class NewAccountButton extends React.Component<{
    onClick: () => void;
}> {
    render() {
        return (
            <Button testId="signup" theme="affirmative" onClick={this.props.onClick}>
                {t('button_CreateAccount')}
            </Button>
        );
    }
}
