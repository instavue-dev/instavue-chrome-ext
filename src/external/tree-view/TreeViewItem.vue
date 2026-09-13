<template>
    <div class="tree-view-item">
        <div v-if="isObject(data) && isShowingCurrent" class="tree-view-item-leaf">
            <div class="tree-view-item-node" @click.stop="toggleOpen()">
                <span :class="{opened: isOpen()}" class="tree-view-item-key tree-view-item-key-with-chevron">

                    <template v-if="1 === currentDepth ">
                        <span class="insta_vue_variable_control">
                            <a href="#" :style="{opacity: pinnedVars.includes(data.key) ? 1 : 0.3}" @click.prevent="togglePinnedVar(data.key)">📌</a>
                        </span>

                        <i class="insta_vue_atribute_type" v-if="getTypeString(data.key)" :title="getTypeString(data.key)">{{ getTypeString(data.key)[0] }}</i>
                    </template>


                    {{ getKey(data) }}
                </span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length === 1">{{data.children.length}} property</span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length !== 1">{{data.children.length}} properties</span>
            </div>

            <tree-view-item
                    v-for="child in data.children" :key="getKey(child)" :path="path.concat(child.key)"
                    :component="component"
                    :favourites="favourites" :filters="nextFilters" :prop-types="propTypes"
                    :max-depth="maxDepth" :current-depth="currentDepth+1" v-show="isOpen()"
                    :data="child" :modifiable="modifiable"
                    @change-data="onChangeData"></tree-view-item>
        </div>

        <div class="tree-view-item-leaf" v-if="isArray(data) && isShowingCurrent">
            <div class="tree-view-item-node" @click.stop="toggleOpen()">
                <span :class="{opened: isOpen()}" class="tree-view-item-key tree-view-item-key-with-chevron">
                    <template v-if="1 === currentDepth ">
                        <span class="insta_vue_variable_control">
                            <a href="#" :style="{opacity: pinnedVars.includes(data.key) ? 1 : 0.3}" @click.prevent="togglePinnedVar(data.key)">📌</a>
                        </span>

                        <i class="insta_vue_atribute_type" v-if="getTypeString(data.key)" :title="getTypeString(data.key)">{{ getTypeString(data.key)[0] }}</i>
                    </template>

                    {{getKey(data)}}
                </span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length === 1">{{data.children.length}} item</span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length !== 1">{{data.children.length}} items</span>
            </div>
            <tree-view-item
                    v-for="child in data.children" :key="getKey(child)" :path="path.concat(child.key)"
                    :component="component"
                    :favourites="favourites" :filters="nextFilters" :prop-types="propTypes"
                    :max-depth="maxDepth" :current-depth="currentDepth+1" v-show="isOpen()"
                    :data="child" :modifiable="modifiable"
                    @change-data="onChangeData"></tree-view-item>
        </div>

        <tree-view-item-value :path="path" :current-depth="currentDepth + 1" :component="component"
                              v-if="isValue(data) && isShowingCurrent" class="tree-view-item-leaf"
                              :key-type-string="1 === currentDepth ? getTypeString(data.key) : null"
                              :key-string="getKey(data)" :data="data.value" :modifiable="modifiable"
                              @change-data="onChangeData">
        </tree-view-item-value>
    </div>
</template>

<script>
  import _ from 'lodash'
  import TreeViewItemValue from './TreeViewItemValue.vue'
  import {mapGetters, mapMutations} from 'vuex';
  import InstaComponent from "../../app/model/InstaComponent";

  export default {
    components: {
      TreeViewItemValue
    },
    name: "tree-view-item",
    props: {
      data: null,
      maxDepth: Number,
      currentDepth: Number,
      path: {
        type: Array,
        default: () => [],
      },
      modifiable: Boolean,
      propTypes: Object,
      filters: Array,
      favourites: Boolean,
      component: {
        type: InstaComponent,
        required: true,
      },
    },
    data: function () {
      return {
        open: this.currentDepth < this.maxDepth
      }
    },
    computed: {
      ...mapGetters(['pinnedVars']),
      currentFilter() {
        if (this.filters && this.filters.length > 0) {
          return this.filters[0].trim().toLowerCase();
        }

        return null;
      },
      isShowingCurrent() {
        if ((this.favourites && 1 === this.currentDepth) || this.currentDepth < 1) {
          return true;
        }

        return this.matchFilter;
      },
      matchFilter() {
        const filter = this.currentFilter;
        if (!filter) {
          return true;
        }

        return (new RegExp(filter)).test(this.keyLC);
      },
      nextFilters() {
        if (this.currentDepth > 0 && this.filters && this.filters.length > 0) {
          return this.filters.slice(1);
        }

        return this.filters;
      },
      keyLC() {
        if (this.data.key && this.data.key.toLowerCase) {
          return this.data.key.toLowerCase();
        }

        return this.data.key;
      },
    },
    methods: {
      ...mapMutations(['togglePinnedVar']),
      getTypeString(key) {
        if (!this.propTypes || !this.propTypes[key]) {
          return null;
        }

        switch (this.propTypes[key]) {
          case 'computed':
            return 'Computed';

          case 'props':
            return 'Prop';

          case '$attrs':
            return 'Attribute';

          case 'data':
            return 'Data';

          case 'injected':
            return 'Injected';

          case 'route':
            return 'Route';

          case 'router':
            return 'Route';

          case 'vuex bindings':
            return 'X - Vuex getter';

          default:
            return '? - Unknown';
        }
      },
      isOpen: function () {
        if (this.currentFilter && this.matchFilter) {
          return true;
        }

        return this.open;
      },
      toggleOpen: function () {
        this.open = !this.open;
      },
      isObject: function (value) {
        return value.type === 'object';
      },
      isArray: function (value) {
        return value.type === 'array';
      },
      isValue: function (value) {
        return value.type === 'value';
      },
      getKey: function (value) {
        if (_.isInteger(value.key)) {
          return value.key + ":";
        } else {
          return value.key + ":";
        }
      },
      isRootObject: function (value = this.data) {
        return value.isRoot;
      },
      onChangeData: function (path, value) {
        path = _.concat(this.data.key, path)
        this.$emit('change-data', path, value)
      }
    }
  };
</script>


<style scoped>

    .tree-view-item {
        font-family: monaco, monospace;
        font-size: 14px;
        margin-left: 18px;
    }

    .tree-view-item-node {
        cursor: pointer;
        position: relative;
        white-space: nowrap;
    }

    .tree-view-item-leaf {
        white-space: nowrap;
    }

    .tree-view-item-key {
        font-weight: bold;
    }

    .tree-view-item-key-with-chevron {
        padding-left: 14px;
    }


    .tree-view-item-key-with-chevron.opened::before {
        top: 4px;
        transform: rotate(90deg);
        -webkit-transform: rotate(90deg);
    }

    .tree-view-item-key-with-chevron::before {
        color: #444;
        /*content: '▶';*/
        content: '>';
        font-size: 10px;
        left: 1px;
        position: absolute;
        top: 3px;
        transition: -webkit-transform .1s ease;
        transition: transform .1s ease;
        transition: transform .1s ease, -webkit-transform .1s ease;
        -webkit-transition: -webkit-transform .1s ease;
    }

    .tree-view-item-hint {
        color: #ccc
    }


    .insta_vue_atribute_type {
        padding: 0 3px;
        border-radius: 3px;
        font-size: 8px;
        color: black;
        border: 1px darkgrey solid;
        vertical-align: middle;
    }

    .insta_vue_variable_control {
        float: right;
        display: none;
    }

    .tree-view-item-node:hover .insta_vue_variable_control {
        display: block !important;
    }

</style>
