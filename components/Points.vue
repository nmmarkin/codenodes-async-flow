<template>
  <Line v-if="chartData" :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  LineElement, PointElement,
  LinearScale, CategoryScale
} from 'chart.js'
import { Line } from 'vue-chartjs'

const props = defineProps({
  datasetName: {
    type: String,
    required: true
  }
})

ChartJS.register(
  Title, Tooltip, Legend,
  LineElement, PointElement,
  LinearScale, CategoryScale
)

const chartData = ref(null)

const chartOptions = {
  responsive: true,
  scales: {
    x: { type: 'linear', title: { display: true, text: 'X Axis' } },
    y: { title: { display: true, text: 'Y Axis' } }
  }
}

const loadData = async (name) => {
  chartData.value = null
  try {
    const response = await fetch(`/points-${name}.json`)
    const rawDatasets = await response.json()

    chartOptions.scales.x = rawDatasets.axis.x
    chartOptions.scales.y = rawDatasets.axis.y

    chartData.value = {
      datasets: rawDatasets.points.map((dataset, i) => ({
        label: dataset.label || `Dataset ${i + 1}`,
        data: dataset.data,
        showLine: false,
        pointBackgroundColor: `hsl(${i * 60}, 70%, 50%)`,
        backgroundColor: `hsl(${i * 60}, 70%, 50%)`,
        pointRadius: 4
      }))
    }
  } catch (err) {
    console.error(`Failed to load /points-${name}.json`, err)
  }
}

onMounted(() => loadData(props.datasetName))
watch(() => props.datasetName, (newVal) => loadData(newVal))
</script>
