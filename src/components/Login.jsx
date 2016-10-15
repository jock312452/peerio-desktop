const React = require('react');
const { Component } = require('react');
const { Layout, Panel, Input } = require('react-toolbox');
const { crypto } = require('../icebear/icebear'); // eslint-disable-line
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');

@observer class Login extends Component {
    @observable username: string ='';
    @observable password: string ='';

    constructor() {
        super();
        this.usernameUpdater = (val: string) => { this.username = val; };
        this.passwordUpdater = (val: string) => { this.password = val; };
    }

    render() {
        return (
          <Layout>
            <Panel className="login">
              <img role="presentation" className="login-logo" src="img/peerio-logo-white.png" />
              <Input type="text" className="login-input" label={t('username')}
                  value={this.username} onChange={this.usernameUpdater} />
              <Input type="password" className="login-input" label={t('password')}
                  value={this.password} onChange={this.passwordUpdater} />
            </Panel>
            <Panel className="welcome">{randomGif()}</Panel>
          </Layout>
    );
    }
}

let cachedGif = null;
function randomGif() {
    return cachedGif || (cachedGif = (<img role="presentation" className="ice-gif"
        src={`ice/${crypto.util.getRandomNumber(1, 25)}.gif`} />));
}


module.exports = Login;
