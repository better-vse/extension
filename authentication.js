// TODO: Add legit domain TM
const api = "https://better-vse.vrba.dev";

const routes = {
    account: {
        create: `${api}/api/v1/account/create`,
        verify: `${api}/api/v1/account/verify`,
        // info: `${api}/api/v1/account/info`
    }
};

export class ApiClient {
    // Rip bozo, he used typescript once
    _token = window.localStorage.getItem("bettervse_jwt_token");
    _logged = _token !== null;

    authentication() {
        return _logged ? { "Authorization": `Bearer ${_token}` } : {};
    }

    /**
     * @param {string} username 
     */
    async createAccount(username) {
        return await fetch(routes.account.create, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "omit",
            body: JSON.stringify({username})
        })
        .then(response => response.json())
        .then(response => response.message);
    }

    /**
     * @param {string} username 
     * @param {string} code 
     * @return {string}
     */
    async completeAccountVerification(username, code) {
        return await fetch(routes.account.verify, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "omit",
            body: JSON.stringify({username, code})
        })
        .then(response => response.json())
        .then(response => {
            this._token = response.token;
            this._logged = true;

            return response.username;
        });
    }
};