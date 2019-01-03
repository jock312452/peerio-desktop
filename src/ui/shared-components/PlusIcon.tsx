import React from 'react';
import css from 'classnames';

interface PlusIconProps {
    className?: string;
    onClick?: (ev: React.MouseEvent) => void;
    label?: React.ReactChild;
    testId?: string;
}

export default class PlusIcon extends React.PureComponent<PlusIconProps> {
    render() {
        return (
            <span
                data-test-id={this.props.testId}
                className={css('plus-icon-container', this.props.className, {
                    clickable: !!this.props.onClick
                })}
                onClick={this.props.onClick}
            >
                {this.props.label && <span className="label">{this.props.label}</span>}
                <span className="plus-icon">+</span>
            </span>
        );
    }
}
