<template>
  <div id="insta_vue_container">
    <div id="insta_vue_inner_container" :class="[`insta_vue_${position}`, {insta_vue_inner_container_minimized: minimized}]">
      <div id="insta_vue_wrapper" v-if="insta">
        <div class="insta_vue_head">
          <div class="insta_vue_head_row">
            <h3 class="insta_vue_title">
              InstaVue
              <small v-if="activeRoot && activeRoot.framework" :title="`Detected ${activeRoot.framework}`">
                {{ activeRoot.framework }}{{ activeRoot.version ? ' ' + activeRoot.version : '' }}
              </small>
            </h3>

            <div class="insta_vue_actions insta_vue_collapse" title="Minimize / expand">
              <button class="insta_vue_action_btn" :disabled="minimized" @click="minimized = true" title="Minimize"></button>
              <button class="insta_vue_action_btn" :disabled="!minimized" @click="minimized = false" title="Expand"></button>
            </div>

            <button class="insta_vue_close" @click="doDestroy" title="Close InstaVue"></button>
          </div>

          <div class="insta_vue_head_row" v-show="!minimized">
            <a href="https://forms.gle/zQB6t2HCcFDVmiP1A" target="_blank" rel="noopener" class="insta_vue_link">Support/Discuss</a>

            <div class="insta_vue_actions insta_vue_position" title="Dock the panel left / right">
              <button class="insta_vue_action_btn" :disabled="'left' === position" @click="setPosition('left')" title="Dock left"></button>
              <button class="insta_vue_action_btn" :disabled="'right' === position" @click="setPosition('right')" title="Dock right"></button>
            </div>
          </div>

          <!-- Minimap of the inspected page - to be implemented, hidden for now -->
          <div class="insta_vue_minimap" v-if="showMinimap && !minimized"></div>
        </div>

        <div class="insta_vue_body" v-show="!minimized">
          <p v-if="0 === insta.roots.length" class="insta_vue_empty">
            No Vue apps detected
          </p>

          <ul class="insta_vue_roots" v-if="insta.roots.length > 1">
            <li v-for="root in insta.roots" :key="root.name + root.framework">
              <a href="#" @click.prevent="activeRoot = root" :class="{insta_vue_roots_active: root === activeRoot}" :title="root.framework">
                {{ root.name }}
              </a>
            </li>
          </ul>

          <RootView v-if="activeRoot" :insta="insta" :root="activeRoot.root" :children="activeRoot.instances"/>

          <div id="insta_vue_container_footer">
            <a href="https://enloop.md" target="_blank" rel="noopener" class="insta_vue_banner" title="enloop.md - manage human context">
              enloop.md &mdash; manage human context
            </a>
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
      // the minimap is not implemented yet
      showMinimap: false,
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
    setPosition(position) {
      setTimeout(() => {
        this.position = position;
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

<style src="./assets/panel.css"></style>
