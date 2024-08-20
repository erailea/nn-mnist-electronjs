class NeuralNetwork {
  constructor(inputNodes, hiddenNodes, outputNodes) {
    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;

    // Initialize weights with random values
    this.weights_ih = new Array(this.hiddenNodes)
      .fill()
      .map(() => new Array(this.inputNodes).fill().map(() => Math.random()));
    this.weights_ho = new Array(this.outputNodes)
      .fill()
      .map(() => new Array(this.hiddenNodes).fill().map(() => Math.random()));

    // Initialize biases with random values
    this.bias_h = new Array(this.hiddenNodes).fill().map(() => Math.random());
    this.bias_o = new Array(this.outputNodes).fill().map(() => Math.random());
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  sigmoidDerivative(x) {
    return x * (1 - x);
  }

  softmax(arr) {
    const expArr = arr.map(Math.exp);
    const sumExpArr = expArr.reduce((a, b) => a + b, 0);
    return expArr.map((exp) => exp / sumExpArr);
  }

  forward(input) {
    // Calculate hidden layer activations
    this.hidden = this.weights_ih.map((weights, i) =>
      this.sigmoid(
        weights.reduce(
          (sum, weight, j) => sum + weight * input[j],
          this.bias_h[i]
        )
      )
    );

    // Calculate output layer activations
    this.output = this.weights_ho.map((weights, i) =>
      weights.reduce(
        (sum, weight, j) => sum + weight * this.hidden[j],
        this.bias_o[i]
      )
    );

    // Apply softmax to output layer
    this.output = this.softmax(this.output);

    return this.output;
  }

  backward(input, target) {
    // Calculate output layer error
    const outputErrors = this.output.map((output, i) => target[i] - output);

    // Calculate hidden layer error
    const hiddenErrors = this.hidden.map((hidden, i) =>
      this.weights_ho.reduce(
        (sum, weights, j) => sum + weights[i] * outputErrors[j],
        0
      )
    );

    // Update weights and biases for the output layer
    this.weights_ho = this.weights_ho.map((weights, i) =>
      weights.map((weight, j) => weight + outputErrors[i] * this.hidden[j])
    );
    this.bias_o = this.bias_o.map((bias, i) => bias + outputErrors[i]);

    // Update weights and biases for the hidden layer
    this.weights_ih = this.weights_ih.map((weights, i) =>
      weights.map(
        (weight, j) =>
          weight +
          hiddenErrors[i] * this.sigmoidDerivative(this.hidden[i]) * input[j]
      )
    );
    this.bias_h = this.bias_h.map(
      (bias, i) =>
        bias + hiddenErrors[i] * this.sigmoidDerivative(this.hidden[i])
    );
  }

  train(input, target, iterations = 10000) {
    for (let i = 0; i < iterations; i++) {
      this.forward(input);
      this.backward(input, target);
    }
  }

  predict(input) {
    return this.forward(input);
  }
}

module.exports = NeuralNetwork;
