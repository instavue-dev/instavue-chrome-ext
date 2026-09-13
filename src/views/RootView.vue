<template>
    <div class="insta_vue_root">
        <template v-if="!selected">
            <a href="#" @click.prevent="search = ''" v-show="search" style="position: absolute; right: 36px; top: 39px;">&times;</a>
            <input v-model="search" placeholder="Filter components" id="insta_vue_search_input" @keyup.esc="search = ''"/>

            <label style="float: right;">
                <input type="checkbox" v-model="showInvisibleComponents"> - show invis
            </label>

            <label style="float: right; margin-right: 10px;">
                <input type="checkbox" v-model="showIgnoredComponents"> - show ignored
            </label>
            <div v-for="component in filteredChildren" :key="component._uid" :class="{'insta_vue_component_invisible': component.isInvisible}">
                <a href="#" @click="selected = component" @mouseover="hovered = component" @mouseout="hovered = null" :style="{'padding-left': `${component.level * 5}px`}">
                    {{ component.name }}
                </a>

                <span v-if="pinnedComponents.includes(component.name)" title="Is in pinned">📌</span>
            </div>

            <div v-if="ignoredComponents.length > 0">
                <hr>

                Ignored:
                <ul>
                    <li v-for="ignored in ignoredComponents">
                        {{ ignored }}

                        <a href="#" @click.prevent="unignoreComponent(ignored)" title="Un ignore component">&times;</a>
                    </li>
                </ul>
            </div>
        </template>


        <template v-if="selected">
            <ul id="insta_vue_parents">
                <li>[&larr; <a href="#" @click="selected = null">See all</a>]&nbsp;</li>

                <li v-for="parent in parents" :key="parent._uid">
                    <a href="#" @click="selected = parent" @mouseover="hovered = parent" @mouseout="hovered = null">
                        {{ parent.name }}
                    </a>

                    <span v-if="pinnedComponents.includes(parent.name)" title="Pinned component">📌</span>
                </li>
            </ul>

            <h3>
                {{ selected.name }}

                <a href="#" @click.prevent="togglePinnedComponent(selected.name)" :style="{opacity: isCurrentPinned ? 1 : 0.2}" title="Pin/Unpin component">📌</a>
                <a href="#" @click.prevent="toggleIgnoredComponent(selected.name)" :style="{opacity: isCurrentIgnored ? 1 : 0.2}" title="Ignore/Un ignore component">👁</a>
            </h3>

            <ComponentInspector :selected="selected"/>
        </template>

    </div>
</template>

<script>
  import InstaComponent from "../app/model/InstaComponent";
  import ComponentInspector from "./ComponentInspector";
  import InstaVue from "../app/InstaVue";
  import {mapGetters, mapMutations} from 'vuex';

  export default {
    name: "RootView",
    components: {ComponentInspector},
    props: {
      insta: {
        type: InstaVue,
        required: true,
      },
      root: {
        type: InstaComponent,
        required: true,
      },
      children: {
        type: Array,
        required: true,
      }
    },
    data() {
      return {
        showInvisibleComponents: false,
        showIgnoredComponents: false,
        search: '',
      };
    },
    computed: {
      ...mapGetters(['pinnedComponents', 'ignoredComponents']),
      visibleChildren() {
        const withInvisible = this.showInvisibleComponents;
        const withIgnored = this.showIgnoredComponents;

        return this.children.filter(child => (withInvisible || child.area > 100) && (withIgnored || !this.ignoredComponents.includes(child.name)));
      },
      filteredChildren() {
        const search = this.search.trim().toLowerCase();
        if (!search) {
          return this.visibleChildren;
        }

        const regexp = new RegExp(`${this.search}`);
        return this.visibleChildren.filter(child => this.pinnedComponents.includes(child.name) || regexp.test(child.name.toLowerCase()));
      },
      selected: {
        get() {
          return this.insta.selectedInstance;
        },
        set(value) {
          this.insta.selectedInstance = value;
        }
      },
      hovered: {
        get() {
          return this.insta.hoveredInstance;
        },
        set(value) {
          this.insta.hoveredInstance = value;
          const el = value && value.$els[0];
          if (el && el.scrollIntoView) {
            el.scrollIntoView();
          }

          this.insta.render();
        }
      },
      parents() {
        if (!this.selected) {
          return null;
        }

        const parents = [];
        let parent = this.selected.parent;
        while (parent && parent.parent) {
          parents.unshift(parent);

          parent = parent.parent;
        }

        return parents;
      },
      // TODO: move this to Vuex with LS/Cookies storage for instavue origin
      isCurrentPinned() {
        return this.pinnedComponents.includes(this.selected.name);
      },
      isCurrentIgnored() {
        return this.ignoredComponents.includes(this.selected.name);
      },
    },
    watch: {
      showInvisibleComponents() {
        this.insta.showInvisibleComponents = this.showInvisibleComponents;
        this.insta.render();
      },
      showIgnoredComponents() {
        this.insta.showIgnoredComponents = this.showIgnoredComponents;
        this.insta.render();
      },
      ignoredComponents(value) {
        this.insta.ignoredComponents = value;
      }
    },
    methods: {
      ...mapMutations(['togglePinnedComponent', 'unignoreComponent', 'toggleIgnoredComponent']),
    },
    mounted() {
      this.selected = this.children.find(instance => this.pinnedComponents.includes(instance.name));


      this.insta.ignoredComponents = this.ignoredComponents;
    },
  }
</script>

<style scoped>

    #insta_vue_search_input {
        width: 100%;
    }

    #insta_vue_parents {
        margin: 0;
        padding: 0;
    }

    #insta_vue_parents li {
        display: inline-block;
        margin-right: 5px;
    }

    #insta_vue_parents li:after {
        content: '>';
    }

    /*
    #insta_vue_parents li:last-child:after {
        content: '';
    }
    */

    .insta_vue_component_invisible {
        opacity: 0.5;
    }

</style>

