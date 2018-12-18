import Vue from 'vue';
import Vuex from 'vuex';

import saveState from './saver';
import authentication from './authentication';

Vue.use(Vuex);

const plugins = [saveState];

export default new Vuex.Store({
  modules: {
    authentication,
  },
  plugins,
});
