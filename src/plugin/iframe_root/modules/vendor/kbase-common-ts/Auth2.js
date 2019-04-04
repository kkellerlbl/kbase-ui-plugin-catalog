define(["require", "exports", "./Html", "./HttpUtils", "./HttpClient", "./Auth2Client", "./Auth2Error"], function (require, exports, Html_1, HttpUtils_1, HttpClient_1, Auth2Client_1, Auth2Error_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const endpoints = {
        root: '',
        tokenInfo: 'api/V2/token',
        apiMe: 'api/V2/me',
        me: 'me',
        loginStart: 'login/start',
        logout: 'logout',
        loginChoice: 'login/choice',
        loginCreate: 'login/create',
        loginUsernameSuggest: 'login/suggestname',
        loginPick: 'login/pick',
        loginCancel: 'login/cancel',
        linkStart: 'link/start',
        linkCancel: 'link/cancel',
        linkChoice: 'link/choice',
        linkPick: 'link/pick',
        linkRemove: 'me/unlink',
        tokens: 'tokens',
        tokensRevoke: 'tokens/revoke',
        tokensRevokeAll: 'tokens/revokeall',
        userSearch: 'api/V2/users/search',
        adminUserSearch: 'api/V2/admin/search',
        adminUser: 'api/V2/admin/user'
    };
    class Auth2 {
        constructor(config) {
            this.config = config;
        }
        getProviders() {
            return [
                {
                    id: 'Globus',
                    label: 'Globus',
                    logoutUrl: 'https://www.globus.org/app/logout'
                },
                {
                    id: 'Google',
                    label: 'Google',
                    logoutUrl: 'https://accounts.google.com/Logout'
                }
            ];
        }
        getProvider(providerId) {
            var providers = this.getProviders();
            return providers.filter((provider) => {
                return (provider.id === providerId);
            })[0];
        }
        root() {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    Accept: 'application/json'
                }),
                url: this.makePath([endpoints.root])
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        loginStart(config) {
            var state = JSON.stringify(config.state);
            let html = new Html_1.Html();
            let t = html.tagMaker();
            let form = t('form');
            let input = t('input');
            let button = t('button');
            let search = new HttpUtils_1.HttpQuery({
                state: JSON.stringify(config.state)
            }).toString();
            var url = document.location.origin + '?' + search;
            let query = {
                provider: config.provider,
                redirecturl: url,
                stayloggedin: config.stayLoggedIn ? 'true' : 'false'
            };
            let formId = html.genId();
            let content = form({
                method: 'post',
                id: formId,
                action: this.makePath(endpoints.loginStart),
                style: {
                    display: 'hidden'
                }
            }, [
                input({
                    type: 'hidden',
                    name: 'provider',
                    value: query.provider
                }, []),
                input({
                    type: 'hidden',
                    name: 'redirecturl',
                    value: query.redirecturl
                }, [])
            ]);
            var donorNode = document.createElement('div');
            donorNode.innerHTML = content;
            document.body.appendChild(donorNode);
            document.getElementById(formId).submit();
        }
        linkStart(token, config) {
            let html = new Html_1.Html();
            let t = html.tagMaker();
            let form = t('form');
            let input = t('input');
            let query = {
                provider: config.provider
            };
            let formId = html.genId();
            let content = form({
                method: 'POST',
                id: formId,
                action: [this.config.baseUrl, endpoints.linkStart].join('/'),
                style: {
                    display: 'hidden'
                }
            }, [
                input({
                    type: 'hidden',
                    name: 'provider',
                    value: query.provider
                }, []),
                input({
                    type: 'hidden',
                    name: 'token',
                    value: token
                })
            ]);
            config.node.innerHTML = content;
            document.getElementById(formId).submit();
        }
        decodeError(result) {
            var error;
            try {
                return JSON.parse(result.response);
            }
            catch (ex) {
                console.error(ex);
                throw new Auth2Error_1.AuthError({
                    code: 'decode-error',
                    message: 'Error decoding JSON error response',
                    detail: ex.message
                });
            }
        }
        removeLink(token, config) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json',
                    accept: 'application/json'
                }),
                url: this.makePath([endpoints.linkRemove, config.identityId])
            })
                .then((result) => {
                return this.processResult(result, 204);
            });
        }
        logout(token) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json',
                    'accept': 'application/json'
                }),
                url: this.makePath(endpoints.logout)
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        revokeToken(token, tokenid) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json'
                }),
                url: this.makePath([endpoints.tokensRevoke, tokenid])
            })
                .then((result) => {
                return this.processResult(result, 204);
            });
        }
        revokeAllTokens(token) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json'
                }),
                url: this.makePath(endpoints.tokensRevokeAll)
            })
                .then((result) => {
                return this.processResult(result, 204);
            });
        }
        getTokenInfo(token) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                url: this.makePath([endpoints.tokenInfo]),
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        getMe(token) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.apiMe),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        putMe(token, data) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'PUT',
                withCredentials: true,
                url: this.makePath(endpoints.me),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json',
                    'content-type': 'application/json'
                }),
                data: JSON.stringify(data)
            })
                .then((result) => {
                this.processResult(result, 204);
            });
        }
        makePath(path) {
            if (typeof path === 'string') {
                return [this.config.baseUrl].concat([path]).join('/');
            }
            return [this.config.baseUrl].concat(path).join('/');
        }
        getTokens(token) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.tokens]),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        createToken(token, create) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath(endpoints.tokens),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json',
                    'content-type': 'application/json'
                }),
                data: JSON.stringify(create)
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        getLoginChoice() {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.loginChoice),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        loginCancel() {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                url: this.makePath(endpoints.loginCancel),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 204);
            });
        }
        linkCancel() {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                url: this.makePath(endpoints.linkCancel),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 204);
            });
        }
        loginPick(arg) {
            let data = {
                id: arg.identityId,
                linkall: arg.linkAll,
                policyids: arg.agreements.map((a) => {
                    return [a.id, a.version].join('.');
                })
            };
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath([endpoints.loginPick]),
                data: JSON.stringify(data),
                header: new HttpClient_1.HttpHeader({
                    'content-type': 'application/json',
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        loginCreate(data) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath(endpoints.loginCreate),
                data: JSON.stringify(data),
                header: new HttpClient_1.HttpHeader({
                    'content-type': 'application/json',
                    'accept': 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 201);
            });
        }
        loginUsernameSuggest(username) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.loginUsernameSuggest, username]),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        getLinkChoice(token) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.linkChoice),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json',
                    authorization: token
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            })
                .then((response) => {
                if (response.haslinks) {
                    return {
                        id: response.idents[0].id,
                        expires: response.expires,
                        cancelurl: response.cancelurl,
                        pickurl: response.pickurl,
                        canlink: true,
                        provider: response.provider,
                        provusername: response.idents[0].provusername,
                        linkeduser: null,
                        user: response.user
                    };
                }
                else {
                    return {
                        id: response.linked[0].id,
                        expires: response.expires,
                        cancelurl: response.cancelurl,
                        pickurl: response.pickurl,
                        canlink: false,
                        provider: response.provider,
                        provusername: response.linked[0].provusername,
                        linkeduser: response.linked[0].user,
                        user: response.user
                    };
                }
            });
        }
        linkPick(token, identityId) {
            let data = {
                id: identityId
            };
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath(endpoints.linkPick),
                data: JSON.stringify(data),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json',
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 204);
            });
        }
        processResult(result, expectedResponse) {
            if (result.status >= 200 && result.status < 300) {
                if (expectedResponse !== result.status) {
                    throw new Auth2Error_1.AuthError({
                        code: 'unexpected-response-code',
                        message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                    });
                }
                if (result.status === 200 || result.status === 201) {
                    switch (result.header.getContentType().mediaType) {
                        case 'application/json':
                            return JSON.parse(result.response);
                        case 'text/plain':
                            return result.response;
                    }
                }
                else if (result.status === 204) {
                    return null;
                }
                else {
                    throw new Auth2Error_1.AuthError({
                        code: 'unexpected-response-code',
                        message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                    });
                }
            }
            else {
                var auth2ErrorData, errorResponse;
                var errorText = result.response;
                try {
                    switch (result.header.getContentType().mediaType) {
                        case 'application/json':
                            auth2ErrorData = JSON.parse(errorText);
                            break;
                        default:
                            if (result.status === 502) {
                                errorResponse = {
                                    code: 'proxy-error',
                                    status: result.status,
                                    message: 'The auth service could not be contacted due to a proxy error (502)',
                                    detail: 'An error returned by the proxy service indicates that the auth service is not operating corectly',
                                    data: {
                                        text: result.response
                                    }
                                };
                            }
                            else {
                                errorResponse = {
                                    code: 'invalid-content-type',
                                    status: result.status,
                                    message: 'An invalid content type was returned',
                                    detail: 'An invalid content was returned',
                                    data: {
                                        text: result.response,
                                        contentType: result.header.getContentType().mediaType,
                                        status: result.status
                                    }
                                };
                            }
                    }
                }
                catch (ex) {
                    throw new Auth2Error_1.AuthError({
                        code: 'decoding-error',
                        status: result.status,
                        message: 'Error decoding error message',
                        detail: 'Original error code: ' + result.status,
                        data: {
                            text: errorText
                        }
                    });
                }
                if (auth2ErrorData) {
                    let code = auth2ErrorData.error.code || auth2ErrorData.error.appcode || auth2ErrorData.error.httpcode || 0;
                    throw new Auth2Error_1.AuthError({
                        code: String(code),
                        status: result.status,
                        message: auth2ErrorData.error.message || auth2ErrorData.error.apperror,
                        data: auth2ErrorData
                    });
                }
                throw new Auth2Error_1.AuthError(errorResponse);
            }
        }
        userSearch(token, searchInput) {
            let httpClient = new Auth2Client_1.AuthClient();
            let path = this.makePath([endpoints.userSearch, searchInput.prefix]);
            let search = new HttpUtils_1.HttpQuery({
                fields: searchInput.fields
            }).toString();
            let url = path + '?' + search;
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: url,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        adminUserSearch(token, searchInput) {
            let httpClient = new Auth2Client_1.AuthClient();
            let search = new HttpUtils_1.HttpQuery({
                fields: searchInput.fields
            }).toString();
            let url = this.makePath([endpoints.adminUserSearch, searchInput.prefix]) + '?' + search;
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: url,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
        getAdminUser(token, username) {
            let httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.adminUser, username]),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then((result) => {
                return this.processResult(result, 200);
            });
        }
    }
    exports.Auth2 = Auth2;
});
