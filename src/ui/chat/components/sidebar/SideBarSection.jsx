const React = require('react');
const { observer } = require('mobx-react');
const { FontIcon } = require('~/react-toolbox');
const css = require('classnames');

@observer
class SideBarSection extends React.Component {
    render() {
        return (
            <div className={css('sidebar-section', { closed: !this.props.open, open: this.props.open })} >
                <div className={css('list-header', { clickable: this.props.onToggle })} onClick={this.props.onToggle}>
                    <div className="section-title">{this.props.title}</div>
                    {this.props.onToggle && <FontIcon value={this.props.open ? 'arrow_drop_up' : 'arrow_drop_down'} />}
                </div>
                <div className="section-content">
                    {this.props.open ? this.props.children : null}
                </div>
            </div>
        );
    }
}

module.exports = SideBarSection;