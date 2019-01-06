<template>
  <v-navigation-drawer left app v-model="expanded">
    <v-toolbar color="primary" dark>
      <!-- <div>Navigation</div> -->
    </v-toolbar>
    <v-layout column style="padding: 18px;">
      <v-layout column align-center style="margin: 9px;">
        <span class="title" @click="showWebId = !showWebId" style="cursor:pointer;">{{profile.fn}}</span>
        <v-tooltip bottom :value="showWebId">
          <span slot="activator"></span>
          <span>{{profile.id}}</span>
        </v-tooltip>
      </v-layout>
      <v-layout justify-center style="margin: 9px;">
        <img :src="profile.hasPhoto" width="200" height="200" />
      </v-layout>
      <v-layout justify-center style="margin: 9px;" v-if="profile.email">
        <span class="title">{{profile.email.split(':')[1]}}</span>
      </v-layout>
      <v-layout justify-center style="margin: 9px;" v-if="profile.role || profile.organization_name">
        <span class="title">{{profile.role}}</span>
        <span class="title" v-if="profile.role && profile.organization_name">&nbsp;at&nbsp;</span>
        <span class="title">{{profile.organization_name}}</span>
      </v-layout>
      <v-divider style="margin: 18px 0px;" />
    </v-layout>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'MenuNav',
  data () {
    return {
      showWebId: false
    }
  },
  computed: {
    expanded: {
      get (): boolean {
        return this.$store.getters.menuExpanded
      },
      set (value: boolean) {
        if (value !== this.$store.getters.menuExpanded) {
          this.$store.commit('structure/set_menu', value)
        }
      }
    },
    profile: {
      get (): any {
        return this.$store.getters.profile || {}
      },
    }
  },
  mounted () {
    console.log('profile', this.profile)
  },
});
</script>

<style scoped>

</style>
