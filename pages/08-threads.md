# Thread overload
<div class="swap-container">
  <div v-click-hide="1">
    <h6>Worker threads</h6>
    <Points datasetName="workers" />
  </div>
  <div v-click="1">
    <h6>Thread pool</h6>
    <Points datasetName="threadpool" />
  </div>
</div>

<style>
.swap-container .slidev-vclick-hidden {
  display: none;
}
</style>