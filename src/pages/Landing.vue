<template>
  <div>
    <Header />
    <Tutorial :tutorial="tutorial" isLanding :tutorialId="tutorial.formattedId"/>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import Tutorial from '../components/Tutorial.vue'
import { getTutorialByUrl } from '../utils/tutorials'
import router from '../router'

export default {
  components: {
    Header,
    Tutorial
  },
  props: {
    tutorialUrl: String
  },
  computed: {
    tutorial: function () {
      const tutorial = getTutorialByUrl(this.tutorialUrl)

      // If no tutorial was found, redirect to 404 page
      if (!tutorial) {
        router.replace({ name: '404' })
        return
      }

      return tutorial
    }
  }
}
</script>
