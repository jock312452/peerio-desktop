import React from 'react';
import { Button } from 'peer-ui';
import css from 'classnames';
import { observer } from 'mobx-react';

export interface AppNavButtonProps {
    active: boolean;
    onClick: () => void;
    tooltip: string;
    icon: string;
    showBadge?: boolean;
    className?: string;
    testId?: string;
}

@observer
export default class AppNavButton extends React.Component<AppNavButtonProps> {
    render() {
        return (
            <div
                className={css('menu-item', this.props.className, { active: this.props.active })}
                onClick={this.props.onClick}
            >
                <Button
                    tooltip={this.props.tooltip}
                    tooltipPosition="right"
                    icon={this.props.icon}
                    testId={this.props.testId}
                />
                <div className={this.props.showBadge ? 'look-at-me' : 'banish'} />
            </div>
        );
    }
}
