const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs");
const tfvis = require("@tensorflow/tfjs-vis");

// Construct the path to the model
const modelPath = path.join(__dirname, "models", "model.json");

async function loadAndVisualizeModel() {
  // Load the model from the specified path
  const model = await tf.loadLayersModel(`file://${modelPath}`);

  // Print the model summary to the console
  model.summary();

  // Visualize the model architecture using tfjs-vis
  const surface = { name: "Model Summary", tab: "Model Info" };
  tfvis.show.modelSummary(surface, model);

  // Save the model visualization as an HTML file
  const html = tfvis.visor().el.innerHTML;
  fs.writeFileSync("model-visualization.html", html);
}

// Load and visualize the model
loadAndVisualizeModel();
