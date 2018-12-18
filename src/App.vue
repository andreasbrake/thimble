<template>
  <v-app>
    <v-toolbar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Thimble</span>
        <span class="font-weight-light"> a distributed social network</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        flat
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
      >
        <span class="mr-2">Latest Release</span>
        <v-icon>fas fa-external-link-alt</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <HelloWorld/>
    </v-content>
    
    <v-navigation-drawer right app>
      <div>Drawer</div>
    </v-navigation-drawer>
    <v-navigation-drawer left app>
      <div>Drawer</div>
    </v-navigation-drawer>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';

export default Vue.extend({
  name: 'App',
  components: {
    HelloWorld,
  },
  data () {
    return {
      //
    };
  },
  mounted () {
    this.$store.dispatch('authentication/init');
  },
});
</script>
