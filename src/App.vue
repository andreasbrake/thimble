<template>
  <v-app>
    <v-toolbar app color="primary" dark>
      <v-btn icon @click="toggleMenu" color="primary">
        <v-icon>fas fa-bars</v-icon>
      </v-btn>
      <v-toolbar-title class="headline text-uppercase">
        <span>Thimble</span>
        <span class="font-weight-light"> a distributed social network</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    
    <menu-nav />
    <v-content>
      <river />
    </v-content>
    <!-- <menu-friends /> -->
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

import River from '@/views/River.vue';

import MenuFriends from '@/components/FriendsMenu.vue';
import MenuNav from '@/components/NavMenu.vue';


export default Vue.extend({
  name: 'App',
  components: {
    River,
    MenuFriends,
    MenuNav,
  },
  data () {
    return {
      //
    };
  },
  methods: {
    toggleMenu () {
      this.$store.dispatch('structure/toggleMenu')
    }
  },
  mounted () {
    this.$store.dispatch('authentication/init');
  },
});
</script>
