<template>
    <div>
        <a href="#" @click.prevent="selected = component" @mouseover="hovered = component">
            {{ component.$options._componentTag }}
        </a>

        <span v-if="isFavourite" title="Is in favourites">♥</span>
    </div>
</template>

<script>
  export default {
    name: 'ComponentLink',
    props: {
      component: {
        type: Object,
        required: true,
      }
    }
  }
</script>
