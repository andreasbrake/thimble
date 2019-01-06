import solidAPI from '@/solid';
import { registerKeys, purgeKeys } from '@/solid/registerSetup';
import * as crypto from '@/util/crypto';
import { Profile } from '@/solid/types';

interface IState {
  status: string;
  offline: boolean;
  message: string;
  solidAuth: any;
  profile: Profile | null;
}
interface IAction {
  commit: any;
  state: IState;
}

// initial state
const initialState = (commit: any): IState => {
  const initialAuth = localStorage.getItem('thimble-auth');
  if (initialAuth !== null) {
    try {
      return JSON.parse(initialAuth);
    } catch (e) {
      console.log('Invalid local auth');
    }
  }

  return {
    status: 'logout',
    offline: false,
    message: '',
    solidAuth: null,
    profile: null,
  };
};

// getters
const getters = {
  readOnlyMode: (state: IState) => state.offline,
  profile: (state: IState) => state.profile,
  loginStatus: (state: IState) => state.status,
  solidAuth: (state: IState) => state.solidAuth,
  loginMessage: (state: IState) => {
    if (state.status !== 'logout') {
      // todo: string replacement
      switch (state.status) {
        case 'begin': {
          return 'Logging In...';
        }
        case 'Success': {
          return 'Sucessfully Logged In';
        }
      }
      return state.message;
    }
    return '';
  },
};

// actions
const actions = {
  async ['authentication/init'] ({ commit, state }: IAction) {
    console.log(' [*] AUTH INIT:', state.status);

    const session = await solidAPI.getSession();
    const keys = await solidAPI.getKeys(true);
    const userprofile = await solidAPI.getProfile();

    if (!session || !userprofile) {
      console.log(' [!] AUTH ERROR: Not logged in');
      solidAPI.logout().then(() => {
        localStorage.removeItem('solid-auth-client');
        commit('authentication/logout');
      }).then(() => {
        return solidAPI.login()
      });
    } else if (!keys) {
      console.log(' [!] AUTH ERROR: Account incorrectly configured');
      commit('authentication/set_registering', true);
    } else {
      console.log(' [\u2713] AUTH SUCCESS');
      commit('authentication/login_success', { solidAuth: session, profile: userprofile });
    }
  },
  async ['authentication/configure'] ({ commit, state }: IAction, { address, token }: any) {
    const session = await solidAPI.getSession();
    const userprofile = await solidAPI.getProfile();

    if (session) {
      return;
    }

    let keys = await solidAPI.getKeys(false);

    if (!keys) {
      keys = await crypto.genKeys();
      try {
        await registerKeys(keys);
        commit('authentication/login_success', { solidAuth: session, profile: userprofile });
      } catch (err) {
        await purgeKeys();
        commit('authentication/registration_error', { message: 'Could not configure pod' });
      }
    }
  },
  async ['authentication/login'] ({ commit, state }: IAction, provider: string) {
    commit('authentication/begin_login');
    const session = await solidAPI.login(provider);
    const keys = await solidAPI.getKeys(true);
    const userprofile = await solidAPI.getProfile();

    if (!session || !userprofile) {
      return commit('authentication/login_error', 'Could not log in to solid provider');
    } else if (!keys) {
      return commit('authentication/set_registering');
    } else {
      return commit('authentication/login_success', { solidAuth: session, profile: userprofile });
    }
  },
  ['authentication/logout'] ({ commit, state }: IAction) {
    solidAPI.logout().then(() => {
      localStorage.removeItem('solid-auth-client');
    });
  },
  ['authentication/goOffline']  ({ commit, state }: IAction) {
    commit('authentication/go_offline');
  },
};

// mutations
const mutations = {
  ['authentication/begin_login'] (state: IState) {
    state.status = 'begin';
    state.solidAuth = null;
    state.offline = false;
  },
  ['authentication/login_success'] (state: IState, { solidAuth, profile }: any) {
    state.status = 'success';
    state.solidAuth = solidAuth;
    state.profile = profile;
    state.offline = false;
  },
  ['authentication/logout'] (state: IState) {
    state.status = 'logout';
    state.solidAuth = null;
    state.profile = null;
    state.offline = false;
    state.message = '';
  },
  ['authentication/login_error'] (state: IState, message: string) {
    state.status = 'login_error';
    state.solidAuth = null;
    state.message = message;
  },

  ['authentication/set_registering'] (state: IState) {
    state.status = 'registering';
  },
  ['authentication/registration_error'] (state: IState, message: string) {
    state.status = 'registration_error';
    state.message = message;
  },

  ['authentication/go_offline'] (state: IState) {
    state.offline = true;
  },
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
};
