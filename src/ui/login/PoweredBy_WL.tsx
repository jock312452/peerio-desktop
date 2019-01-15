import React from 'react';

// @observer
export default class PoweredBy extends React.PureComponent {
    render() {
        return (
            <img
                className="poweredBy"
                alt="Powered by Peerio"
                src="static/img/poweredByPeerio_white.svg"
            />
        );
    }
}
