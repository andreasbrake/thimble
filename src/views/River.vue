<template>
  <v-container>
    <div>
      <v-layout column>
        <v-textarea
          v-model="postContent"
          :readonly="posting"
          solo
          placeholder="Share something..." />
        <v-layout align-center>
          <v-spacer />
          <span>Share something with</span>
          <v-select
            v-model="selectedPostMode"
            :items="allPostModes" 
            style="max-width: 300px; margin-left: 18px;"/>
          <v-btn color="accent" @click="post" :disabled="posting">
            Share!
          </v-btn>
        </v-layout>
      </v-layout>
      <v-divider />
      <v-layout justify-center v-if="loading">
        <v-progress-circular
          indeterminate
          color="primary" />
      </v-layout>
      <template v-else>
        <v-card class="content-card" v-for="s in stones" :key="s.author + s.created">
          <v-layout column>
            <v-card-title>
              <v-layout align-start>
                <span class="title" style="margin-right: 5px;">{{s.author}}</span>
                <span v-if="s.createdDate === today" class="subheading">Today at {{new Date(s.created).toLocaleTimeString()}}</span>
                <span v-else-if="s.createdDate === yesterday" class="subheading">Yesterday at {{new Date(s.created).toLocaleTimeString()}}</span>
                <span v-else class="subheading">on {{new Date(s.created).toLocaleString()}}</span>
              </v-layout>
            </v-card-title>
            <v-divider />
            <v-card-text>{{s.content}}</v-card-text>
          </v-layout>
        </v-card>
        <v-layout justify-center v-if="loadingMore">
          <v-progress-circular
            indeterminate
            color="primary" />
        </v-layout>
        <v-layout justify-center v-else>
          <v-btn flat color="primary" @click="loadPast7Days">Load Past 7 Days</v-btn>
        </v-layout>
      </template>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { postItem, loadToday, loadWeek } from '@/solid/river';

export default Vue.extend({
  name: 'River',
  data () {
    return {
      posting: false,
      loading: false,
      loadingMore: false,
      postContent: '',
      selectedPostMode: 'the world',
      allPostModes: [
        'the world',
        'your neighborhood',
        'your friends',
        'yourself (maybe you\'re lonely)',
      ],
      dayStones: [] as any[],
      weekStones: [] as any[],
    };
  },
  computed: {
    today () {
      return new Date().toISOString().split('T')[0]
    },
    yesterday () {
      return new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 1).toISOString().split('T')[0]
    },
    stones (): any {
      return this.dayStones.concat(this.weekStones)
    },
  },
  methods: {
    post () {
      this.posting = true
      postItem(this.postContent, '').then(() => {
        this.posting = false
        console.log('POSTED!');
        this.dayStones.unshift({
          author: this.$store.getters.profile.name,
          created: new Date().toISOString(),
          content: this.postContent
        })
        this.postContent = ''
      });
    },
    async loadContent () {
      this.loading = true
      const following = [
        'https://asb.solid.community/',
        'https://abrake.inrupt.net/'
      ]
      const allStones = await Promise.all(following.map((f) => loadToday(f)));
      this.loading = false
      console.log('got items', allStones)
      this.dayStones = allStones.reduce((full, item) => full.concat(item), []).sort((a, b) =>
        new Date(a.created) < new Date(b.created) ? 1 : -1
      )
    },
    async loadPast7Days () {
      this.loadingMore = true
      const following = [
        'https://asb.solid.community/',
        'https://abrake.inrupt.net/'
      ]
      const allStones = await Promise.all(following.map((f) => loadWeek(f)));
      this.loadingMore = false
      console.log('got more items', allStones)
      this.weekStones = allStones.reduce((full, item) => full.concat(item), []).sort((a, b) =>
        new Date(a.created) < new Date(b.created) ? 1 : -1
      )
    }
  },
  mounted () {
    this.loadContent()
  },
});
</script>

<style scoped>
.content-card {
  margin: 18px 0px;
}
</style>
