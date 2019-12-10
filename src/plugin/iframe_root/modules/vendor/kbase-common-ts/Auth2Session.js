define(["require", "exports", "./Cookie", "./Auth2", "./Auth2Error", "./Utils", "bluebird"], function (require, exports, Cookie_1, Auth2_1, Auth2Error_1, Utils_1, Promise) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CacheState;
    (function (CacheState) {
        CacheState[CacheState["New"] = 1] = "New";
        CacheState[CacheState["Ok"] = 2] = "Ok";
        CacheState[CacheState["Stale"] = 3] = "Stale";
        CacheState[CacheState["Syncing"] = 4] = "Syncing";
        CacheState[CacheState["Error"] = 5] = "Error";
        CacheState[CacheState["Interrupted"] = 6] = "Interrupted";
        CacheState[CacheState["None"] = 7] = "None";
    })(CacheState || (CacheState = {}));
    class Auth2Session {
        constructor(config) {
            this.cookieName = config.cookieName;
            this.extraCookies = config.extraCookies;
            this.baseUrl = config.baseUrl;
            this.cookieManager = new Cookie_1.CookieManager();
            this.auth2Client = new Auth2_1.Auth2(config);
            this.serviceLoopActive = false;
            this.cookieMaxAge = 300000;
            this.changeListeners = {};
            this.sessionCache = {
                session: null,
                fetchedAt: 0,
                state: CacheState.New
            };
        }
        getSession() {
            if (this.sessionCache.state === CacheState.Ok) {
                return this.sessionCache.session;
            }
            return null;
        }
        getToken() {
            var session = this.getSession();
            if (session) {
                return session.token;
            }
            return null;
        }
        getUsername() {
            var session = this.getSession();
            if (session) {
                return session.tokenInfo.user;
            }
            return null;
        }
        getEmail() {
            var session = this.getSession();
            if (session) {
                return session.me.email;
            }
            return null;
        }
        getRealname() {
            var session = this.getSession();
            if (session) {
                return session.me.display;
            }
            return null;
        }
        getRoles() {
            var session = this.getSession();
            if (session) {
                return session.me.roles;
            }
            return null;
        }
        getCustomRoles() {
            var session = this.getSession();
            if (session) {
                return session.me.customroles;
            }
            return null;
        }
        getKbaseSession() {
            var session = this.getSession();
            if (!session) {
                return null;
            }
            let info = session.tokenInfo;
            return {
                un: info.user,
                user_id: info.user,
                name: info.name,
                token: session.token,
                kbase_sessionid: null
            };
        }
        isAuthorized() {
            var session = this.getSession();
            if (session) {
                return true;
            }
            return false;
        }
        isLoggedIn() {
            return this.isAuthorized();
        }
        getClient() {
            return this.auth2Client;
        }
        loginPick(arg) {
            return this.auth2Client.loginPick(arg)
                .then((result) => {
                this.setSessionCookie(result.token.token, result.token.expires);
                return this.evaluateSession()
                    .then(() => {
                    return result;
                });
            });
        }
        loginCreate(data) {
            return this.auth2Client.loginCreate(data);
        }
        initializeSession(tokenInfo) {
            this.setSessionCookie(tokenInfo.token, tokenInfo.expires);
            return this.evaluateSession();
        }
        loginUsernameSuggest(username) {
            return this.auth2Client.loginUsernameSuggest(username);
        }
        loginCancel() {
            return this.auth2Client.loginCancel();
        }
        linkCancel() {
            return this.auth2Client.linkCancel();
        }
        getMe() {
            return this.auth2Client.getMe(this.getToken());
        }
        putMe(data) {
            return this.auth2Client.putMe(this.getToken(), data);
        }
        getTokens() {
            return this.auth2Client.getTokens(this.getToken());
        }
        createToken(data) {
            return this.auth2Client.createToken(this.getToken(), data);
        }
        getTokenInfo() {
            return this.auth2Client.getTokenInfo(this.getToken());
        }
        getLoginCoice() {
            return this.auth2Client.getLoginChoice();
        }
        loginStart(config) {
            this.auth2Client.loginStart(config);
        }
        linkStart(config) {
            return this.auth2Client.linkStart(this.getToken(), config);
        }
        removeLink(config) {
            return this.auth2Client.removeLink(this.getToken(), config);
        }
        getLinkChoice(token) {
            return this.auth2Client.getLinkChoice(this.getToken());
        }
        linkPick(identityId) {
            return this.auth2Client.linkPick(this.getToken(), identityId)
                .then((result) => {
                return result;
            });
        }
        logout(tokenId) {
            return this.auth2Client.logout(this.getToken())
                .then(() => {
                this.removeSessionCookie();
                return this.evaluateSession();
            });
        }
        revokeToken(tokenId) {
            let that = this;
            return this.getTokenInfo()
                .then((tokenInfo) => {
                return this.auth2Client.revokeToken(this.getToken(), tokenId);
            });
        }
        revokeAllTokens() {
            let that = this;
            return this.getTokenInfo()
                .then((tokenInfo) => {
                return this.auth2Client.revokeAllTokens(this.getToken());
            });
        }
        onChange(listener) {
            let utils = new Utils_1.Utils();
            let id = utils.genId();
            this.changeListeners[id] = listener;
            return id;
        }
        offChange(id) {
            delete this.changeListeners[id];
        }
        notifyListeners(change) {
            if (change === null) {
                return;
            }
            Object.keys(this.changeListeners).forEach((key) => {
                let listener = this.changeListeners[key];
                try {
                    listener(change);
                }
                catch (ex) {
                    console.error('Error running change listener', key, ex);
                }
            });
        }
        checkSession() {
            let cookieToken = this.getAuthCookie();
            let currentSession = this.getSession();
            let hadSession = currentSession ? true : false;
            var result = null;
            let now = new Date().getTime();
            if (!cookieToken) {
                if (this.sessionCache.session) {
                    this.sessionCache.session = null;
                    this.sessionCache.state = CacheState.None;
                    return {
                        status: 'loggedout'
                    };
                }
                else {
                    this.sessionCache.state = CacheState.None;
                    return {
                        status: 'nosession'
                    };
                }
            }
            if (this.sessionCache.session === null) {
                return {
                    status: 'newtoken',
                    cookie: cookieToken
                };
            }
            if (cookieToken !== this.sessionCache.session.token) {
                this.sessionCache.session = null;
                return {
                    status: 'newtoken',
                    cookie: cookieToken
                };
            }
            let expiresIn = this.sessionCache.session.tokenInfo.expires - now;
            if (expiresIn <= 0) {
                this.sessionCache.session = null;
                this.sessionCache.state = CacheState.None;
                this.removeSessionCookie();
                return {
                    status: 'loggedout'
                };
            }
            else if (expiresIn <= 300000) {
            }
            if (this.sessionCache.state === CacheState.Interrupted) {
                let interruptedFor = now - this.sessionCache.interruptedAt;
                let checkedFor = now - this.sessionCache.lastCheckedAt;
                if (interruptedFor < 60000) {
                    if (checkedFor > 5000) {
                        return {
                            status: 'interrupted-retry',
                            cookie: cookieToken
                        };
                    }
                }
                else {
                    if (checkedFor > 60000) {
                        return {
                            status: 'interrupted-retry',
                            cookie: cookieToken
                        };
                    }
                }
                return {
                    status: 'ok',
                    cookie: cookieToken
                };
            }
            let sessionAge = now - this.sessionCache.fetchedAt;
            if (sessionAge > this.sessionCache.session.tokenInfo.cachefor) {
                this.sessionCache.state = CacheState.Stale;
                return {
                    status: 'cacheexpired',
                    cookie: cookieToken
                };
            }
            return {
                status: 'ok',
                cookie: cookieToken
            };
        }
        getAuthCookie() {
            var cookies = this.cookieManager.getItems(this.cookieName);
            if (cookies.length === 1) {
                return cookies[0];
            }
            if (cookies.length === 0) {
                return null;
            }
            if (cookies.length === 2) {
                this.removeSessionCookie();
            }
            var cookies = this.cookieManager.getItems(this.cookieName);
            if (cookies.length > 0) {
                throw new Error('Duplicate session cookie detected and cannot remove it. Please delete your browser cookies for this site.');
            }
        }
        evaluateSession() {
            return Promise.try(() => {
                let change = null;
                let sessionState = this.checkSession();
                switch (sessionState.status) {
                    case 'loggedout':
                        this.notifyListeners('loggedout');
                        return;
                    case 'ok':
                        return;
                    case 'nosession':
                        return;
                    case 'interrupted-retry':
                    case 'newtoken':
                    case 'cacheexpired':
                        break;
                    default: throw new Error('Unexpected session state: ' + sessionState.status);
                }
                let cookieToken = sessionState.cookie;
                this.sessionCache.lastCheckedAt = new Date().getTime();
                var tokenInfo;
                var me;
                return this.auth2Client.getTokenInfo(cookieToken)
                    .then((result) => {
                    tokenInfo = result;
                    return this.auth2Client.getMe(cookieToken);
                })
                    .then((result) => {
                    me = result;
                    this.sessionCache.fetchedAt = new Date().getTime();
                    this.sessionCache.state = CacheState.Ok;
                    this.sessionCache.interruptedAt = null;
                    this.sessionCache.session = {
                        token: cookieToken,
                        tokenInfo: tokenInfo,
                        me: me
                    };
                    switch (sessionState.status) {
                        case 'newtoken':
                            this.notifyListeners('loggedin');
                            break;
                        case 'interrupted-retry':
                            this.notifyListeners('restored');
                            break;
                        case 'cacheexpired':
                    }
                })
                    .catch(Auth2Error_1.AuthError, (err) => {
                    switch (err.code) {
                        case '10020':
                            console.error('Invalid Session Cookie Detected', err);
                            this.removeSessionCookie();
                            this.notifyListeners('loggedout');
                        case 'connection-error':
                        case 'timeout-error':
                        case 'abort-error':
                            this.sessionCache.state = CacheState.Interrupted;
                            this.sessionCache.interruptedAt = new Date().getTime();
                            this.notifyListeners('interrupted');
                            switch (sessionState.status) {
                                case 'cacheexpired':
                                case 'newtoken':
                                    this.sessionCache.fetchedAt = new Date().getTime();
                                    this.notifyListeners('interrupted');
                                    break;
                                case 'interrupted-retry':
                                    this.notifyListeners('interrupted');
                                    break;
                            }
                            break;
                        default:
                            console.error('Unhandled AUTH ERROR', err);
                            this.removeSessionCookie();
                            this.notifyListeners('loggedout');
                    }
                })
                    .catch((err) => {
                    console.error('ERROR', err, err instanceof Auth2Error_1.AuthError);
                    this.session = null;
                    this.removeSessionCookie();
                    if (sessionState === 'newtoken') {
                        this.notifyListeners('loggedout');
                    }
                });
            });
        }
        serverTimeOffset() {
            return this.now - this.root.servertime;
        }
        start() {
            return this.auth2Client.root()
                .then((root) => {
                this.root = root;
                this.now = new Date().getTime();
                return Promise.try(() => {
                    let nextLoop = () => {
                        if (!this.serviceLoopActive) {
                            return;
                        }
                        this.loopTimer = window.setTimeout(serviceLoop, 1000);
                    };
                    let serviceLoop = () => {
                        return this.evaluateSession()
                            .then(() => {
                            nextLoop();
                        });
                    };
                    this.serviceLoopActive = true;
                    return serviceLoop();
                });
            });
        }
        stop() {
            return Promise.try(() => {
                this.serviceLoopActive = false;
                if (this.loopTimer) {
                    window.clearTimeout(this.loopTimer);
                    this.loopTimer = null;
                }
            });
        }
        setSessionCookie(token, expiration) {
            let sessionCookie = new Cookie_1.Cookie(this.cookieName)
                .setValue(token)
                .setPath('/')
                .setSecure(true);
            sessionCookie.setExpires(new Date(expiration).toUTCString());
            this.cookieManager.setItem(sessionCookie);
            let that = this;
            if (this.extraCookies) {
                this.extraCookies.forEach((cookieConfig) => {
                    let extraCookie = new Cookie_1.Cookie(cookieConfig.name)
                        .setValue(token)
                        .setPath('/')
                        .setDomain(cookieConfig.domain);
                    extraCookie.setExpires(new Date(expiration).toUTCString());
                    that.cookieManager.setItem(extraCookie);
                });
            }
        }
        removeSessionCookie() {
            this.cookieManager.removeItem(new Cookie_1.Cookie(this.cookieName)
                .setPath('/'));
            let domainParts = window.location.hostname.split('.');
            var domain;
            for (var len = 2; len <= domainParts.length; len += 1) {
                domain = domainParts.slice(-len).join('.');
                this.cookieManager.removeItem(new Cookie_1.Cookie(this.cookieName)
                    .setPath('/').setDomain(domain));
            }
            if (this.extraCookies) {
                this.extraCookies.forEach((cookieConfig) => {
                    this.cookieManager.removeItem(new Cookie_1.Cookie(cookieConfig.name)
                        .setPath('/')
                        .setDomain(cookieConfig.domain));
                });
            }
        }
        userSearch(search) {
            return this.auth2Client.userSearch(this.getToken(), search);
        }
        adminUserSearch(search) {
            return this.auth2Client.adminUserSearch(this.getToken(), search);
        }
        getAdminUser(username) {
            return this.auth2Client.getAdminUser(this.getToken(), username);
        }
    }
    exports.Auth2Session = Auth2Session;
});
