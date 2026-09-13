<template>
    <div class="tree-view-item-row">
        <span class="tree-view-item-key" :class="{'tree-view-item-key-top': keyTypeString}">
          <i class="insta_vue_atribute_type" v-if="keyTypeString" :title="keyTypeString">{{ keyTypeString[0] }}</i>

          {{keyString}}
        </span>

        <input v-if="modifiable" class="tree-view-item-value" :class="getValueType(data)" v-model="valueString" @keyup.enter="onUpdateData" @blur="onUpdateData">
        <span v-else class="tree-view-item-value" :class="getValueType(data)" @dblclick="editValue" title="Double-click to edit">{{ valueFormed }}</span>
        <span v-if="error" class="tree-view-item-error">{{ error }}</span>

        <span class="insta_vue_variable_control" v-if="keyTypeString">
            <a href="#" :class="{insta_vue_variable_control_active: pinnedVars.includes(keyString)}" @click.prevent="togglePinnedVar(keyString)" :title="pinnedVars.includes(keyString) ? 'Unpin' : 'Pin'"></a>
        </span>
    </div>
</template>

<script>
  import _ from 'lodash'
  import {mapGetters, mapMutations} from 'vuex';

  export default {
    name: 'tree-view-item-value',
    props: ['data', 'modifiable', 'key-string', 'key-type-string', "current-depth", "path", "component"],
    data: function () {
      return {
        valueString: this.data && this.data.toString(),
        error: false,
      }
    },
    computed: {
      ...mapGetters(['pinnedVars']),
      valueFormed: function () {
        return this.getValue(this.data)
      }
    },
    watch: {
      valueFormed: function (val) {
        this.$set(this, 'valueString', _.isString(val) ? val.replace(/^["]+|["]+$/g, '') : val)
      }
    },
    methods: {
      ...mapMutations(['togglePinnedVar']),
      editValue() {
        const old = JSON.stringify(this.data);

        let edited = prompt(`Edit value {${this.path.join('.')}}`, old);
        try {
            edited = JSON.parse(edited);
        } catch (e) {
          alert('Entered value seems to be invalid');
          console.log(e);

          return;
        }

        try {
          if (edited && edited !== old) {
            this.component.setValue(this.path, edited);

            this.$emit('change-data', [], edited)
          }
        } catch (e) {
          alert('Something went wrong');
          console.log(e);
        }

      },
      onUpdateData: function () {
        try {
          let v = this.typedValue(this.valueString)
          this.error = false
          this.$emit('change-data', [], v)
        } catch (err) {
          this.error = err
        }
      },
      typedValue: function (v) {
        if (v == '') {
          throw 'empty'
        }

        let dataType = this.getValueType(this.data, '')

        switch (dataType) {
          case 'number':
            if (_.isNaN(_.toNumber(v))) {
              throw 'only number'
            }
            return _.toNumber(v)
          case 'boolean':
            if (v.toLowerCase() === 'true') {
              return true
            }
            if (v.toLowerCase() === 'false') {
              return false
            }
            throw 'true or false'
          case 'string':
          default:
            return v
        }
      },
      getValue: function (value) {
        if (_.isNumber(value)) {
          return value
        }
        if (_.isNull(value)) {
          return "null"
        }
        if (_.isString(value)) {
          return "\"" + value + "\"";
        }
        return value;
      },
      getValueType: function (value, prefix = "tree-view-item-value-") {
        if (_.isNumber(value)) {
          return prefix + "number"
        }
        if (_.isFunction(value)) {
          return prefix + "function"
        }
        if (_.isBoolean(value)) {
          return prefix + "boolean"
        }
        if (_.isNull(value)) {
          return prefix + "null"
        }
        if (_.isString(value)) {
          return prefix + "string";
        }
        return prefix + "unknown";
      }
    }
  }
</script>


<style scoped>

    .tree-view-item-row {
        display: flex;
        align-items: center;
        line-height: 22px;
        font-size: 14px;
        white-space: nowrap;
    }

    .tree-view-item-key {
        font-weight: 500;
        color: var(--insta-vue-text);
    }

    .tree-view-item-value {
        margin-left: 8px;
        color: var(--insta-vue-green);
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: text;
    }

    .tree-view-item-key-top {
        font-family: var(--insta-vue-mono);
        font-size: 16px;
    }

    .tree-view-item-value-null { color: var(--insta-vue-muted); }

    input.tree-view-item-value {
        font: inherit;
        border: 1px solid var(--insta-vue-line);
        border-radius: 3px;
        padding: 0 6px;
    }

    .tree-view-item-error {
        margin-left: 8px;
        color: #c62828;
        font-size: 12px;
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

    .tree-view-item-row:hover .insta_vue_variable_control {
        display: block;
    }

</style>
