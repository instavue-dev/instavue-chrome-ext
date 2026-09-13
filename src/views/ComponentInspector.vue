<template>
    <div>
        <input v-model="search" style="width: 100%;"
               @keyup.esc="search = search.replace(/>$/, '').split(/[>|]/).slice(0, -1).join('>').replace(/^>$/, '')"
               @keypress.enter="search = (search + '>').replace('>>', '>')"/>

        <TreeView :data="selectedDataPinned" class="insta_vue_data_tree insta_vue_data_tree_pinned"
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
</template>

<script>
  import InstaComponent from "../app/model/InstaComponent";
  import TreeView from "../external/tree-view/TreeView";
  import {getInstanceState} from "../app/util/VueUtil";
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
        return getInstanceState(this.selected.instance);
      },

      selectedDataPinned() {
        return this.selectedState.reduce((a, c) => {
          if (this.pinnedVars.includes(c.key)) {
            a[c.key] = c.value;
          }

          return a;
        }, {});
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
        this.selected.instance.$forceUpdate();
      },
    },
  }
</script>


<style scoped>
    .insta_vue_data_tree_pinned {
        border-bottom: 1px solid grey;
        margin-bottom: 4px;
        padding-bottom: 4px;
    }
</style>