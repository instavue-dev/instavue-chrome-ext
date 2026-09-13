<template>
    <div class="tree-view-item">
        <div v-if="isObject(data) && isShowingCurrent" class="tree-view-item-leaf" :class="{opened: isOpen()}">
            <div class="tree-view-item-node" @click.stop="toggleOpen()">
                <span :class="{opened: isOpen()}" class="tree-view-item-key tree-view-item-key-with-chevron">

                    <template v-if="1 === currentDepth ">
                        <i class="insta_vue_atribute_type" v-if="getTypeString(data.key)" :title="getTypeString(data.key)">{{ getTypeString(data.key)[0] }}</i>
                    </template>


                    {{ getKey(data) }}
                </span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length === 1">{{data.children.length}} property</span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length !== 1">{{data.children.length}} properties</span>
                <span class="insta_vue_variable_control" v-if="1 === currentDepth">
                    <a href="#" :class="{insta_vue_variable_control_active: pinnedVars.includes(data.key)}" @click.prevent="togglePinnedVar(data.key)" :title="pinnedVars.includes(data.key) ? 'Unpin' : 'Pin'"></a>
                </span>
            </div>

            <tree-view-item
                    v-for="child in data.children" :key="getKey(child)" :path="path.concat(child.key)"
                    :component="component"
                    :favourites="favourites" :filters="nextFilters" :prop-types="propTypes"
                    :max-depth="maxDepth" :current-depth="currentDepth+1" v-show="isOpen()"
                    :data="child" :modifiable="modifiable"
                    @change-data="onChangeData"></tree-view-item>
        </div>

        <div class="tree-view-item-leaf" :class="{opened: isOpen()}" v-if="isArray(data) && isShowingCurrent">
            <div class="tree-view-item-node" @click.stop="toggleOpen()">
                <span :class="{opened: isOpen()}" class="tree-view-item-key tree-view-item-key-with-chevron">
                    <template v-if="1 === currentDepth ">
                        <i class="insta_vue_atribute_type" v-if="getTypeString(data.key)" :title="getTypeString(data.key)">{{ getTypeString(data.key)[0] }}</i>
                    </template>

                    {{getKey(data)}}
                </span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length === 1">{{data.children.length}} item</span>
                <span class="tree-view-item-hint" v-show="!isOpen() && data.children.length !== 1">{{data.children.length}} items</span>
                <span class="insta_vue_variable_control" v-if="1 === currentDepth">
                    <a href="#" :class="{insta_vue_variable_control_active: pinnedVars.includes(data.key)}" @click.prevent="togglePinnedVar(data.key)" :title="pinnedVars.includes(data.key) ? 'Unpin' : 'Pin'"></a>
                </span>
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

          case 'setup':
            return 'Setup state';

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
        font-family: var(--insta-vue-sans);
        font-size: 14px;
        margin-left: 13px;
    }

    /* root node: no indent, key hidden (it is the component itself) */
    .tree-view-item-root {
        margin-left: 0 !important;
    }

    .tree-view-item-root > .tree-view-item-leaf > .tree-view-item-node {
        display: none;
    }

    .tree-view-item-root > .tree-view-item-leaf > .tree-view-item {
        margin-left: 13px;
        margin-bottom: 15px;
    }

    .tree-view-item-leaf {
        position: relative;
        white-space: nowrap;
    }

    /* dashed guide line for an expanded node */
    .tree-view-item-leaf.opened::after {
        content: '';
        position: absolute;
        top: 22px;
        bottom: 2px;
        left: -11px;
        border-left: 1px dashed var(--insta-vue-line);
    }

    .tree-view-item-root > .tree-view-item-leaf.opened::after {
        display: none;
    }

    .tree-view-item-node {
        display: flex;
        align-items: center;
        position: relative;
        cursor: pointer;
        line-height: 22px;
        white-space: nowrap;
    }

    .tree-view-item-key {
        font-weight: 500;
        color: var(--insta-vue-text);
    }

    /* top level keys of the component: mono */
    .tree-view-item-root > .tree-view-item-leaf > .tree-view-item > .tree-view-item-leaf > .tree-view-item-node > .tree-view-item-key {
        font-family: var(--insta-vue-mono);
        font-size: 16px;
    }

    .tree-view-item-key-with-chevron {
        padding-left: 0;
    }

    .tree-view-item-key-with-chevron::before {
        content: '';
        position: absolute;
        top: 50%;
        left: -13px;
        width: 7px;
        height: 8px;
        background: url('../../assets/img/arr-drop.svg') center no-repeat;
        transform: translateY(-50%);
        transition: transform .1s ease;
    }

    .tree-view-item-key-with-chevron.opened::before {
        transform: translateY(-50%) rotate(90deg);
    }

    .tree-view-item-hint {
        color: var(--insta-vue-muted);
        margin-left: 8px;
        font-size: 13px;
    }

    .insta_vue_variable_control {
        margin-left: auto;
        padding-left: 10px;
        display: none;
    }

    .insta_vue_variable_control a {
        display: inline-block;
        width: 26px;
        height: 22px;
        background: url('../../assets/img/heart.svg') center no-repeat;
        opacity: 0.45;
    }

    .insta_vue_variable_control a.insta_vue_variable_control_active {
        opacity: 1;
    }

    .tree-view-item-node:hover .insta_vue_variable_control {
        display: block !important;
    }

</style>
