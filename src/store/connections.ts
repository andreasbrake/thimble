import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';

import * as util from '@/solid/util';
import { Profile } from '@/solid/types';

interface IState {
  friends: string[];
  neighborhood: string[];
}
interface IAction {
  commit: any;
  state: IState;
}

// initial state
const initialState = (commit: any): IState => {
  return {
    friends: [],
    neighborhood: [],
  };
};

// getters
const getters = {
  friends: (state: IState) => state.friends,
};

// actions
const actions = {
  async ['connections/addFriend']  ({ commit, state }: IAction, card: string) {
    const session = await util.getSession();
    const host = session.webId.split('/profile')[0];

    await util.getFetcher().webOperation(
      'POST',
      `${host}/public/app_data/thimble/friends.ttl`,
      {
        contentType: 'application/sparql-update',
        data: `
          INSERT DATA {
            <#this> <http://purl.org/dc/elements/1.1/friends> <${card}>
          }
        `
      }
    );
    commit('connections/set_friends', state.friends.concat([card]))
  },
};

// mutations
const mutations = {
  ['connections/set_friends'] (state: IState, people: string[]) {
    state.friends = people;
  },
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
};
