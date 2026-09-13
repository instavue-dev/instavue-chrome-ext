import Vue from 'vue'
import App from './App.vue'
import VuexPersistence from 'vuex-persist';
import Vuex from 'vuex';

Vue.use(Vuex);

Vue.config.productionTip = false;

const vuexLS = new VuexPersistence({
  storage: window.localStorage
});


const store = new Vuex.Store({
  state: {
    pinnedComponents: [],
    pinnedVars: [],

    ignoredComponents: [],
    ignoredVars: [],
  },
  getters: {
    pinnedComponents: state => state.pinnedComponents,
    pinnedVars: state => state.pinnedVars,
    ignoredComponents: state => state.ignoredComponents,
    ignoredVars: state => state.ignoredVars,
  },
  mutations: {
    togglePinnedComponent(state, name) {
      if (state.pinnedComponents.includes(name)) {
        this.commit('unpinComponent', name);
      } else {
        this.commit('pinComponent', name);
      }
    },
    pinComponent(state, name) {
      if (!state.pinnedComponents.includes(name)) {
        state.pinnedComponents.push(name);
      }
      this.commit('unignoreComponent', name);
    },
    unpinComponent(state, name) {
      state.pinnedComponents = state.pinnedComponents.filter(pinned => pinned !== name);
    },

    togglePinnedVar(state, name) {
      if (state.pinnedVars.includes(name)) {
        this.commit('unpinVar', name);
      } else {
        this.commit('pinVar', name);
      }
    },
    pinVar(state, name) {
      if (!state.pinnedVars.includes(name)) {
        state.pinnedVars.push(name);
      }
      this.commit('unignoreVar', name);
    },
    unpinVar(state, name) {
      state.pinnedVars = state.pinnedVars.filter(pinned => pinned !== name);
    },

    toggleIgnoredComponent(state, name) {
      if (state.ignoredComponents.includes(name)) {
        this.commit('unignoreComponent', name);
      } else {
        this.commit('ignoreComponent', name);
      }
    },
    ignoreComponent(state, name) {
      if (!state.ignoredComponents.includes(name)) {
        state.ignoredComponents.push(name);
      }
      this.commit('unpinComponent', name);
    },
    unignoreComponent(state, name) {
      state.ignoredComponents = state.ignoredComponents.filter(ignored => ignored !== name);
    },

    toggleIgnoredVar(state, name) {
      if (state.ignoredVars.includes(name)) {
        this.commit('unignoreVar', name);
      } else {
        this.commit('ignoreVar', name);
      }
    },
    ignoreVar(state, name) {
      if (!state.ignoredVars.includes(name)) {
        state.ignoredVars.push(name);
      }
      this.commit('unpinVar', name);
    },
    unignoreVar(state, name) {
      state.ignoredVars = state.ignoredVars.filter(ignored => ignored !== name);
    },
  },
  plugins: [vuexLS.plugin],
});


const node = document.createElement('DIV');
node.id = 'insta_vue_container';
document.body.appendChild(node);

new Vue({
  store,
  render: h => h(App),
  methods: {
    makeDestroy() {
      console.log("Making distruction");
      this.$destroy();
      node.remove();
    }
  },
  destroyed() {
    node.remove();
  },
  beforeDestroy() {
    node.remove();
  },
}).$mount(node);
