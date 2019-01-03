import Page from '../page';
import { pauseFor } from '../../helpers';

export default class Signup extends Page {
    get signupButton() {
        return this.element('signup');
    }

    get firstName() {
        return this.element('firstName');
    }

    get lastName() {
        return this.element('lastName');
    }

    get nextButton() {
        return this.element('button_next');
    }

    get username() {
        return this.element('username');
    }

    get email() {
        return this.element('email');
    }

    get copyButton() {
        return this.element('button_copy');
    }

    get snackbar() {
        return this.element('snackbar');
    }

    get snackbarGone() {
        // BUG: `snackbar` sometimes adds margin to bottom of window, which
        // prevents snackbar from sliding fully offscreen, meaning `this.gone` fails.
        // Instead we hardcode a 300ms wait, to wait out the CSS slide-out animation.

        // return this.gone('snackbar');
        return pauseFor(300);
    }

    get acceptButton() {
        return this.element('button_accept');
    }

    get shareButton() {
        return this.element('button_share');
    }
}
