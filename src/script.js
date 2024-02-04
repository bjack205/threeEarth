import Visualizer from './Visualizer/Visualizer'

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Vizualizer
const viz = new Visualizer(canvas)
viz.update()