define(['kb_common_ts/Auth2'], (auth2) => {
    'use strict';
    class SessionService {
        constructor({ runtime }) {
            this.runtime = runtime;

            this.auth2Root = null;
            this.serverTime = null;

            this.auth2Client = new auth2.Auth2({
                baseUrl: runtime.config('services.auth.url')
            });
        }

        getAuthToken() {
            return this.runtime.token;
        }
        getUsername() {
            return this.runtime.username;
        }
        isLoggedIn() {
            return this.runtime.token ? true : false;
        }
        isAuthorized() {
            return this.runtime.token ? true : false;
        }
        getClient() {
            return this.auth2Session;
        }
        getKBaseSession() {
            return {
                un: this.runtime.username,
                user_id: this.runtime.username,
                name: this.runtime.username,
                token: this.runtime.token,
                kbase_sessionid: null
            };
        }

        serverTimeOffset() {
            return Date.now() - this.serverTime;
        }

        start() {
            // return this.auth2Session.start();
            return this.auth2Client.root().then((root) => {
                this.auth2Root = root;
                this.serverTime = root.servertime;
            });
        }

        stop() {
            // return this.auth2Session.stop();
            return new Promise.resolve();
        }
    }

    return SessionService;
});
