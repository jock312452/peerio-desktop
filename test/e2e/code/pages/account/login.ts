import Page from '../page';

export default class Login extends Page {
    get switchUser() {
        return this.element('switchUser');
    }

    get username() {
        return this.element('username');
    }

    get accountKey() {
        return this.element('passcodeOrPassphrase');
    }

    // Sign in button on the sign in screen itself, where you enter username and AK
    get signInButton() {
        return this.element('button_signIn');
    }

    // Login button on the NewUser screen (!returning user), next to Create Account button
    get loginButton() {
        return this.element('button_login');
    }
}
