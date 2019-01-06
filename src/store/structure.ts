interface IState {
  menuExpanded: boolean;
}
interface IAction {
  commit: any;
  state: IState;
}

// initial state
const initialState = (commit: any): IState => {
  return {
    menuExpanded: true,
  };
};

// getters
const getters = {
  menuExpanded: (state: IState) => state.menuExpanded,
};

// actions
const actions = {
  ['structure/toggleMenu'] ({ commit, state }: IAction) {
    commit('structure/set_menu', !state.menuExpanded)
  },
};

// mutations
const mutations = {
  ['structure/set_menu'] (state: IState, expanded: boolean) {
    state.menuExpanded = expanded
  },
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
};
