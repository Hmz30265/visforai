from flask import Flask, request, jsonify
from flask_cors import CORS 
import numpy as np
import torch
from model_utils import load_model, get_model_latent, get_activity_latent
from site_information import forecast_sites

app = Flask(__name__)
CORS(app)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load your PyTorch model
data_dir = "models/vfhnn_beta_1"
decoder, config, device = load_model(data_dir, device)

@app.route("/api/latent_activity", methods=["POST"])
def latent_activity():
    mu, logvar = get_model_latent(forecast_sites, data_dir)  # shape: (num_layers, ...)
    var = np.exp(logvar)  # convert logvar to actual variance

    # activity can still be variance across time/dim
    activity = get_activity_latent(mu)

    # Prepare data for frontend traversal: send mean and std per latent
    # For simplicity, we can return mean and std per latent dimension for each layer
    # Here we collapse time dimension if needed (take mean over time axis 0)
    latent_info = []
    for layer_idx in range(mu.shape[0]):
        layer_means = mu[layer_idx].mean(axis=0).tolist()       # mean across time
        layer_stds = np.sqrt(var[layer_idx].mean(axis=0)).tolist()  # std across time
        latent_info.append({"mean": layer_means, "std": layer_stds})

    return jsonify({
        "activity": activity.tolist(),
        "latent_info": latent_info  # send mean/std for slider traversal
    })


@app.route("/api/forecast_sites", methods=["GET"])
def get_forecast_sites():
    return jsonify({"sites": forecast_sites})

if __name__ == "__main__":
    app.run(debug=True)
