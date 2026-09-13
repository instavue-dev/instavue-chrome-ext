<template>
    <div class="insta_vue_inspector">
        <div class="insta_vue_search">
            <input type="search" v-model="search" placeholder="Filter values"
                   @keyup.esc="search = search.replace(/>$/, '').split(/[>|]/).slice(0, -1).join('>').replace(/^>$/, '')"
                   @keypress.enter="search = (search + '>').replace('>>', '>')"/>
            <a href="#" class="insta_vue_action_btn" @click.prevent
               title="Filter keys (regular expression). Enter adds a '>' to filter the next nesting level, Esc removes the last level."></a>
        </div>

        <div class="insta_vue_scroll">
            <TreeView v-if="hasPinned" :data="selectedDataPinned" class="insta_vue_data_tree insta_vue_data_tree_pinned"
                      :options="{maxDepth: 1}" :prop-types="selectedTypes"
                      :component="selected" @change-data="valueChanged"
                      :filters="filters" favourites style="overflow: initial!important;"/>

            <TreeView :component="selected" :data="selectedData"
                      :filters="filters" :options="{maxDepth: 1}" @change-data="valueChanged"
                      :prop-types="selectedTypes" class="insta_vue_data_tree" style="overflow: initial!important;"/>

            <TreeView :component="selected" :data="filteredOutData"
                      :options="{maxDepth: 1}" @change-data="valueChanged"
                      :prop-types="selectedTypes" class="insta_vue_data_tree" style="overflow: initial!important; opacity: 0.4;"/>
        </div>
    </div>
</template>

<script>
  import InstaComponent from "../app/model/InstaComponent";
  import TreeView from "../external/tree-view/TreeView";
  import {mapGetters} from 'vuex';

  export default {
    name: 'ComponentInspector',
    components: {TreeView},
    props: {
      selected: {
        type: InstaComponent,
        required: true,
      },
    },
    data() {
      return {
        touch: 0,
        search: '',
      };
    },
    computed: {
      ...mapGetters(['pinnedVars']),
      filters() {
        return this.search.split(">");
      },
      selectedState() {
        this.touch++; // to run updates
        return this.selected.getState();
      },

      selectedDataPinned() {
        return this.selectedState.reduce((a, c) => {
          if (this.pinnedVars.includes(c.key)) {
            a[c.key] = c.value;
          }

          return a;
        }, {});
      },

      hasPinned() {
        return Object.keys(this.selectedDataPinned).length > 0;
      },

      selectedData() {
        return this.selectedState.reduce((a, c) => {
          if (!this.pinnedVars.includes(c.key)) {
            a[c.key] = c.value;
          }

          return a;
        }, {});
      },

      filteredOutData() {
        if (!this.search) {
          return [];
        }

        const filter = new RegExp(this.search.split('>').shift());

        const data = this.selectedData;

        return Object.keys(data).reduce((a, key) => {
          if (!filter.test(key)) {
            a[key] = data[key];
          }

          return a;
        }, {});
      },

      selectedTypes() {
        return this.selectedState.reduce((a, c) => ({...a, [c.key]: c.type}), {});
      },
    },
    methods: {
      valueChanged() {
        this.touch++;
        this.selected.forceUpdate();
      },
    },
  }
</script>


<style scoped>
    .insta_vue_inspector {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    .insta_vue_data_tree_pinned {
        border-bottom: 1px solid var(--insta-vue-line-soft);
        margin-bottom: 12px;
        padding-bottom: 12px;
    }
</style>
