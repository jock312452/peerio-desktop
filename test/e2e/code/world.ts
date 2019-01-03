import electron from 'electron';
import { Application } from 'spectron';
import fs from 'fs-extra';

import AppNav from './pages/shared/app-nav';
import ChatView from './pages/chat/chat-view';
import ContactsView from './pages/contacts/contacts-view';
import Login from './pages/account/login';
import NewChat from './pages/chat/new-chat';
import Signup from './pages/account/signup';

export default class World {
    app: Application;
    attach: (data: any) => void;

    appNav: AppNav;
    chatView: ChatView;
    contactsView: ContactsView;
    login: Login;
    newChat: NewChat;
    signup: Signup;

    constructor({ attach }) {
        this.attach = attach;
    }

    async openApp() {
        this.app = new Application({
            path: (electron as unknown) as string, // typings are incorrect
            args: ['.'],
            // chromeDriverLogPath: './chromedriver.log',
            // webdriverLogPath: './webdriver.log',
            startTimeout: 20000,
            waitTimeout: 30000
        });
        await this.app.start();
        this.setupPages();
    }

    async stopApp() {
        await this.app.stop();
    }

    async restartApp(deleteData?: boolean) {
        if (deleteData) {
            await this.deleteAppData();
        }
        await this.stopApp();
        await this.openApp();
    }

    setupPages() {
        this.appNav = new AppNav(this.app);
        this.chatView = new ChatView(this.app);
        this.contactsView = new ContactsView(this.app);
        this.signup = new Signup(this.app);
        this.login = new Login(this.app);
        this.newChat = new NewChat(this.app);
    }

    async deleteAppData() {
        await fs.remove(await this.app.electron.remote.app.getPath('userData'));
    }

    async newUser() {
        const newUser = await this.app.client.executeAsync(done => {
            const u = new ice.User();

            u.username = Date.now().toString();
            u.email = `${u.username}@test.lan`;
            u.firstName = 'firstName';
            u.lastName = 'lastName';
            u.locale = 'en';
            u.passphrase = '123';

            return u.createAccountAndLogin().then(() => {
                const { username, email, firstName, lastName, locale, passphrase } = u;
                done({
                    username,
                    email,
                    firstName,
                    lastName,
                    locale,
                    passphrase
                });
            });
        });

        await this.restartApp(true);
        return newUser.value;
    }

    users: {
        [key: string]: {
            username: string;
            email: string;
            firstName: string;
            lastName: string;
            locale: string;
            passphrase: string;
        };
    } = {};
}
