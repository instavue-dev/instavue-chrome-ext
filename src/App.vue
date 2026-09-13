<template>
  <div id="insta_vue_container">
    <div id="insta_vue_inner_container" :class="[`insta_vue_${position}`, {insta_vue_inner_container_minimized: minimized}]">
      <div id="insta_vue_wrapper" v-if="insta">
        <div style="text-align: center;">
          <a href="https://forms.gle/zQB6t2HCcFDVmiP1A" target="_blank" class="ml-4">🚀 JOIN THE COMMUNITY FOR GROW! 🚀</a>
        </div>

        <div>
          <a href="#" @click.prevent="doDestroy" style="float: right;">&times;</a>
          <a href="#" style="float: right; margin-right: 15px;" @click.prevent="minimized = !minimized">Minimize</a>
          <h3 style="margin: 0;">InstaVue</h3>
        </div>

        <p v-if="0===insta.roots.length">
          No Vue apps detected
        </p>

        <div v-show="!minimized">
          <ul class="insta_vue_roots" v-if="insta.roots.length > 1">
            <li v-for="root in insta.roots">
              <a href="#" @click.prevent="activeRoot = root">
                {{ root.name }}
              </a>
            </li>
          </ul>

          <RootView v-if="activeRoot" :insta="insta" :root="activeRoot.root" :children="activeRoot.instances"/>

          <div id="insta_vue_container_footer">
            <div>
              <a href="#" @click.prevent="togglePosition" id="insta_vue_container_footer_switcher">&larr; &rarr;</a>

              <button @click="doDestroy">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <canvas ref="canvas" v-show="!minimized"></canvas>
  </div>
</template>

<script>
import inject from './app/inject';
import ComponentLink from "./ComponentLink";
import RootView from "./views/RootView";

export default {
  name: 'app',
  components: {RootView, ComponentLink},
  data() {
    return {
      insta: null,
      activeRoot: null,
      position: 'left',
      minimized: false,
    };
  },
  watch: {
    'insta.selectedInstance'() {
      this.insta.render();
    },
    activeRoot(root) {
      if (root) {
        this.insta.instances = root.instances;
      }
    },
    minimized() {
      this.insta.adjustCanvas();
      this.insta.render();
    },
  },
  methods: {
    togglePosition() {
      setTimeout(() => {
        this.position = 'left' === this.position ? 'right' : 'left';
      }, 100);
    },
    doDestroy() {
      this.insta.destroy();
      this.$root.makeDestroy();
      setTimeout(() => {
        this.$root.$el.remove();
      }, 100);
    }
  },
  mounted() {
    this.insta = inject(this.$refs.canvas);
    this.activeRoot = this.insta.roots[0];
  },
}
</script>


<style>

#insta_vue_inner_container.insta_vue_inner_container_minimized {
  bottom: initial !important;
}

#insta_vue_inner_container {
  position: fixed;
  width: 25vw;
  top: 0;
  bottom: 0;
  z-index: 1000000;
  padding: 5px;

  font-size: 14px !important;
  color: black;
}

#insta_vue_wrapper {
  background-color: white;
  border: 1px solid grey;
  border-radius: 5px;
  height: 100%;
  overflow: scroll;
  padding: 15px 15px 40px;
}

.insta_vue_right {
  right: 0;
}

/** @deprecated */
span.tree-view-item-key {
  color: black;
}

span.tree-view-item-value {
  color: green;
}

.tree-view-item-root > .tree-view-item-leaf:first-child > .tree-view-item-node:first-child > .tree-view-item-key:first-child {
  display: none;
}

.tree-view-item-root > .tree-view-item-leaf:first-child > .tree-view-item {
  margin-left: 0 !important;
}


.insta_vue_roots {
  margin: 0;
  padding: 0;
}

.insta_vue_roots li {
  display: inline-block;
  margin-right: 5px;
}

.insta_vue_roots li:after {
  content: '|';
}

.insta_vue_roots li:last-child:after {
  content: '';
}

#insta_vue_container_footer > div {
  background-color: rgba(255, 255, 255, 0.9);
}

#insta_vue_container_footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
}

#insta_vue_container_footer_switcher {
  float: right;
}

</style>
