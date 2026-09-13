<template>
    <div class="insta_vue_root">
        <template v-if="!selected">
            <div class="insta_vue_search">
                <input type="search" v-model="search" placeholder="Filter components" id="insta_vue_search_input" @keyup.esc="search = ''"/>
                <a href="#" class="insta_vue_action_btn" @click.prevent title="Filter by name (regular expression). Pinned components always stay visible. Esc clears."></a>
            </div>

            <div class="insta_vue_list_options">
                <label class="insta_vue_toggle">
                    <input type="checkbox" v-model="showInvisibleComponents"> show invisible
                </label>

                <label class="insta_vue_toggle">
                    <input type="checkbox" v-model="showIgnoredComponents"> show ignored
                </label>
            </div>

            <div class="insta_vue_scroll">
                <div class="insta_vue_list">
                    <div v-for="component in filteredChildren" :key="component._uid"
                         class="insta_vue_list_row"
                         :class="{'insta_vue_component_invisible': component.isInvisible, 'insta_vue_list_row_hovered': hovered === component}"
                         :style="{'padding-left': `${component.level * 12}px`}">
                        <a href="#" @click.prevent="selected = component" @mouseover="hovered = component" @mouseout="hovered = null">
                            {{ component.name }}
                        </a>

                        <i v-if="pinnedComponents.includes(component.name)" class="insta_vue_list_pin" title="Pinned"></i>
                    </div>
                </div>

                <div v-if="ignoredComponents.length > 0" class="insta_vue_ignored">
                    <h4>Ignored</h4>
                    <ul>
                        <li v-for="ignored in ignoredComponents" :key="ignored">
                            {{ ignored }}

                            <a href="#" @click.prevent="unignoreComponent(ignored)" title="Stop ignoring">&times;</a>
                        </li>
                    </ul>
                </div>
            </div>
        </template>


        <template v-if="selected">
            <nav class="insta_vue_navigation">
                <ul id="insta_vue_parents">
                    <li><a href="#" @click.prevent="selected = null">See all</a></li>

                    <li v-for="parent in parents" :key="parent._uid">
                        <a href="#" @click.prevent="selected = parent" @mouseover="hovered = parent" @mouseout="hovered = null">
                            {{ parent.name }}
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="insta_vue_current">
                <h3 :title="selected.name">{{ selected.name }}</h3>

                <div class="insta_vue_actions">
                    <button class="insta_vue_round_btn insta_vue_round_btn_pin" :class="{insta_vue_round_btn_active: isCurrentPinned}"
                            @click="togglePinnedComponent(selected.name)" :title="isCurrentPinned ? 'Unpin component' : 'Pin component'"></button>
                    <button class="insta_vue_round_btn insta_vue_round_btn_ignore" :class="{insta_vue_round_btn_active: isCurrentIgnored}"
                            @click="toggleIgnoredComponent(selected.name)" :title="isCurrentIgnored ? 'Stop ignoring component' : 'Ignore component'"></button>
                </div>
            </div>

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

    .insta_vue_root {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    .insta_vue_list_options {
        margin-bottom: 20px;
    }

    .insta_vue_list_row {
        display: flex;
        align-items: center;
        padding-right: 6px;
        line-height: 26px;
        font-family: var(--insta-vue-mono);
        font-weight: 500;
        font-size: 14px;
    }

    .insta_vue_list_row a {
        color: var(--insta-vue-text-soft);
    }

    .insta_vue_list_row a:hover,
    .insta_vue_list_row_hovered a {
        color: var(--insta-vue-blue);
    }

    .insta_vue_list_pin {
        width: 12px;
        height: 11px;
        margin-left: 8px;
        background: url('../assets/img/heart.svg') center / contain no-repeat;
    }

    .insta_vue_component_invisible {
        opacity: 0.5;
    }

    .insta_vue_ignored {
        margin-top: 20px;
        padding-top: 12px;
        border-top: 1px solid var(--insta-vue-line-soft);
        font-size: 14px;
    }

    .insta_vue_ignored h4 {
        margin: 0 0 6px;
        font-size: 13px;
        font-weight: 500;
        color: var(--insta-vue-muted);
    }

    .insta_vue_ignored ul {
        margin: 0;
        padding: 0;
        list-style: none;
        font-family: var(--insta-vue-mono);
    }

    .insta_vue_ignored li a {
        margin-left: 6px;
        color: var(--insta-vue-muted);
    }

    .insta_vue_navigation {
        margin-bottom: 20px;
    }

    #insta_vue_parents {
        display: flex;
        flex-wrap: wrap;
        margin: 0;
        padding: 0 0 12px;
        border-bottom: 1px solid var(--insta-vue-line-soft);
        list-style: none;
    }

    #insta_vue_parents a {
        display: block;
        position: relative;
        padding-right: 30px;
        font-family: var(--insta-vue-mono);
        font-weight: 700;
        font-size: 14px;
        line-height: 22px;
        text-decoration: underline;
    }

    #insta_vue_parents a::after {
        content: '';
        position: absolute;
        top: 50%;
        right: 12px;
        width: 9px;
        height: 6px;
        background: url('../assets/img/arr-up.svg') center / contain no-repeat;
        transform: translateY(-50%) rotate(90deg);
    }

    .insta_vue_current {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        min-width: 0;
    }

    .insta_vue_current h3 {
        font-family: var(--insta-vue-mono);
        font-size: 24px;
        line-height: 32px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .insta_vue_current .insta_vue_actions {
        flex: none;
        margin-left: 11px;
    }

    .insta_vue_current .insta_vue_round_btn + .insta_vue_round_btn {
        margin-left: 5px;
    }

</style>
