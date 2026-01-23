from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings
import tensorflow as tf
from tensorflow import keras

app = Flask(__name__)
CORS(app)

# Global model variable
model = None

def load_model():
    """Load the Keras model from config and weights"""
    global model
    try:
        # Load model architecture from config.json in Demand pattern folder
        with open('Demand pattern/config.json', 'r') as f:
            import json
            config = json.load(f)
        
        model = keras.models.model_from_json(json.dumps(config))
        
        # Load weights from Demand pattern folder
        model.load_weights('Demand pattern/model.weights.h5')
        
        print("✅ Model loaded successfully")
        print(f"📊 Model expects input shape: {model.input_shape}")
        print(f"📊 Model output shape: {model.output_shape}")
        
        return True
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'Flask ML Service is running',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict power consumption
    Input: { "stationId": 5, "hour": 18, "day_num": 2 }
    Output: { "predicted_powerKW": 96.5 }
    """
    try:
        if model is None:
            return jsonify({
                'error': 'Model not loaded'
            }), 500
        
        data = request.get_json()
        
        # Validate input
        if not data or 'stationId' not in data or 'hour' not in data or 'day_num' not in data:
            return jsonify({
                'error': 'Missing required fields: stationId, hour, day_num'
            }), 400
        
        station_id = data['stationId']
        hour = data['hour']
        day_num = data['day_num']
        
        # Validate ranges
        if not (0 <= hour <= 23):
            return jsonify({'error': 'hour must be between 0 and 23'}), 400
        if not (0 <= day_num <= 6):
            return jsonify({'error': 'day_num must be between 0 and 6'}), 400
        
        # Create input sequence (720 timesteps)
        # Using simple pattern based on hour and day for demonstration
        # In production, you'd use actual historical data
        sequence = create_input_sequence(station_id, hour, day_num)
        
        # Reshape for model input: (1, 720, 1)
        input_data = sequence.reshape(1, 720, 1)
        
        # Make prediction
        prediction = model.predict(input_data, verbose=0)
        
        # Extract prediction for the requested hour
        # Model outputs 24 values (one for each hour)
        predicted_power = float(prediction[0][hour])
        
        return jsonify({
            'stationId': station_id,
            'hour': hour,
            'day_num': day_num,
            'predicted_powerKW': round(predicted_power, 2)
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Prediction error: {str(e)}'
        }), 500

def create_input_sequence(station_id, target_hour, day_num):
    """
    Create a 720-timestep input sequence for the model
    This simulates historical data pattern
    In production, fetch actual historical data from MongoDB
    """
    # Create 30 days * 24 hours = 720 timesteps
    sequence = []
    
    for day in range(30):
        for hour in range(24):
            # Simulate power usage pattern
            # Peak hours: 8-10 AM and 6-9 PM
            base_power = 50
            
            if 8 <= hour <= 10:
                power = base_power + 30 + np.random.normal(0, 5)
            elif 18 <= hour <= 21:
                power = base_power + 40 + np.random.normal(0, 5)
            elif 0 <= hour <= 6:
                power = base_power - 20 + np.random.normal(0, 3)
            else:
                power = base_power + np.random.normal(0, 5)
            
            # Weekend adjustment
            if day % 7 in [5, 6]:  # Saturday, Sunday
                power *= 0.8
            
            # Station-specific multiplier
            power *= (1 + (station_id % 10) * 0.1)
            
            sequence.append(max(0, power))
    
    return np.array(sequence)

if __name__ == '__main__':
    print("🤖 Starting Flask ML Service...")
    
    # Load model on startup
    if load_model():
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("❌ Failed to load model. Exiting...")
        exit(1)
