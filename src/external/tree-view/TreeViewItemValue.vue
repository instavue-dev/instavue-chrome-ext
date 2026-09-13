<template>
    <div>
        <span class="tree-view-item-key" :class="keyTypeString ? ['padded'] : []">
          <template v-if="1 === currentDepth">
              <span class="insta_vue_variable_control">
                  <a href="#" :style="{opacity: pinnedVars.includes(keyString) ? 1 : 0.3}" @click.prevent="togglePinnedVar(keyString)">📌</a>
              </span>

              <i class="insta_vue_atribute_type" v-if="getTypeString(keyString)" :title="getTypeString(keyString)">{{ getTypeString(keyString)[0] }}</i>
          </template>

          <i class="insta_vue_atribute_type" v-if="keyTypeString" :title="keyTypeString">{{ keyTypeString[0] }}</i>

          {{keyString}}
        </span>

        <input v-if="modifiable" class="tree-view-item-value" :class="getValueType(data)" v-model="valueString" @keyup.enter="onUpdateData" @blur="onUpdateData">
        <span v-else class="tree-view-item-value" :class="getValueType(data)" @dblclick="editValue">{{ valueFormed }}</span>
        <span v-show="error">{{ error }}</span>
    </div>
</template>


<script>
  import _ from 'lodash'

  export default {
    name: 'tree-view-item',
    props: ['data', 'modifiable', 'key-string', 'key-type-string', "current-depth", "path", "component"],
    data: function () {
      return {
        valueString: this.data && this.data.toString(),
        error: false,
      }
    },
    computed: {
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

    .insta_vue_atribute_type {
        padding: 0 3px;
        border-radius: 3px;
        font-size: 8px;
        color: black;
        border: 1px darkgrey solid;
        vertical-align: middle;
    }

    .padded {
        padding-left: 14px;
    }
</style>