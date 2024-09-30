from flask import Flask, request, jsonify
from flask_cors import CORS
import geojson
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Paths to your GeoJSON files
BUS_STOP_GEOJSON = 'data/Bus_Stop.geojson'
TRAIN_STATION_GEOJSON = 'data/train_station_data.geojson'


def load_geojson_file(filepath):
    """Helper function to load GeoJSON data from a file."""
    with open(filepath) as f:
        return geojson.load(f)


def save_geojson_file(filepath, data):
    """Helper function to save GeoJSON data to a file."""
    with open(filepath, 'w') as f:
        geojson.dump(data, f)


@app.route('/api/bus-stops', methods=['GET'])
def get_bus_stops():
    data = load_geojson_file(BUS_STOP_GEOJSON)
    bus_stops = []
    for feature in data['features']:
        stop = {
            'OBJECTID': feature['properties'].get('OBJECTID'),
            'STOPID': feature['properties'].get('STOPID'),
            'STOPCODE': feature['properties'].get('STOPCODE'),
            'STOPNAME': feature['properties'].get('STOPNAME'),
            'STOPDESC': feature['properties'].get('STOPDESC'),
            'LOCATIONTYPE': feature['properties'].get('LOCATIONTYPE'),
            'STOPLAT': feature['properties'].get('STOPLAT'),
            'STOPLON': feature['properties'].get('STOPLON'),
            'PARENTSTATION': feature['properties'].get('PARENTSTATION'),
            'MODE': feature['properties'].get('MODE'),
            'coordinates': feature['geometry']['coordinates']
        }
        bus_stops.append(stop)
    return jsonify(bus_stops)


@app.route('/api/train-stations', methods=['GET'])
def get_train_stations():
    data = load_geojson_file(TRAIN_STATION_GEOJSON)
    train_stations = []
    for feature in data['features']:
        station = {
            'OBJECTID': feature['properties'].get('OBJECTID'),
            'STOPID': feature['properties'].get('STOPID'),
            'STOPCODE': feature['properties'].get('STOPCODE'),
            'STOPNAME': feature['properties'].get('STOPNAME'),
            'STOPDESC': feature['properties'].get('STOPDESC'),
            'LOCATIONTYPE': feature['properties'].get('LOCATIONTYPE'),
            'STOPLAT': feature['properties'].get('STOPLAT'),
            'STOPLON': feature['properties'].get('STOPLON'),
            'PARENTSTATION': feature['properties'].get('PARENTSTATION'),
            'MODE': feature['properties'].get('MODE'),
            'coordinates': feature['geometry']['coordinates']
        }
        train_stations.append(station)
    return jsonify(train_stations)


def get_last_stop_code(features):
    """Get the last stop code from a list of features and return it."""
    stop_codes = [feature['properties'].get('STOPCODE') for feature in features if feature['properties'].get('STOPCODE') is not None]
    if stop_codes:
        return max(stop_codes)
    return 0


# Helper function to generate STOPID based on STOPCODE
def generate_stop_id(stop_code):
    # Generate a hash for STOPID based on STOPCODE
    stop_hash = hashlib.sha1(str(stop_code).encode()).hexdigest()[:6]
    return f"{stop_code}-{stop_hash}"

@app.route('/save-stop', methods=['POST'])
def save_stop():
    data = request.get_json()

    stop_name = data.get('stopName')
    lat = data.get('lat')
    lon = data.get('lon')
    stop_type = data.get('stopType')  # Get the stop type (busStops or trainStations)

    if not stop_name or not lat or not lon or not stop_type:
        return jsonify({'error': 'Invalid data'}), 400

    # Determine the correct GeoJSON file based on stop type
    if stop_type == 'busStops':
        geojson_file = BUS_STOP_GEOJSON
        mode = "Bus"
    elif stop_type == 'trainStations':
        geojson_file = TRAIN_STATION_GEOJSON
        mode = "Train"
    else:
        return jsonify({'error': 'Invalid stop type'}), 400

    # Round STOPLAT and STOPLON to 5 decimal places
    stop_lat = round(lat, 5)
    stop_lon = round(lon, 5)

    # Load the existing GeoJSON data
    geojson_data = load_geojson_file(geojson_file)

    # Get the last STOPCODE and increment it
    last_stop_code = get_last_stop_code(geojson_data['features'])
    new_stop_code = last_stop_code + 2

    # Generate STOPID using the STOPCODE
    stop_id = generate_stop_id(new_stop_code)

    # Prepare the new stop data
    new_stop = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [stop_lon, stop_lat]  # STOPLON, STOPLAT
        },
        "properties": {
            "OBJECTID": max(feature['properties']['OBJECTID'] for feature in geojson_data['features']) + 1,
            "STOPID": stop_id,
            "STOPCODE": new_stop_code,
            "STOPNAME": stop_name,
            "STOPDESC": f"Added on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "LOCATIONTYPE": "Stop",  # Static value
            "STOPLAT": stop_lat,
            "STOPLON": stop_lon,
            "PARENTSTATION": None,  # Set to null
            "MODE": mode  # Either Bus or Train based on the stop type
        }
    }

    # Append the new stop to the GeoJSON data and save it back to the file
    geojson_data['features'].append(new_stop)

    # Save the updated GeoJSON data back to the file
    save_geojson_file(geojson_file, geojson_data)

    return jsonify(new_stop), 200

@app.route('/update-stop-location', methods=['POST'])
def update_stop_location():
    data = request.get_json()
    stop_id = data.get('OBJECTID')
    stop_type = data.get('stopType')  # Add stop type to the request data
    new_lat = data.get('STOPLAT')
    new_lon = data.get('STOPLON')

    # Map stop_type to the appropriate file path
    if stop_type == 'busStops':
        filepath = BUS_STOP_GEOJSON
    elif stop_type == 'trainStations':
        filepath = TRAIN_STATION_GEOJSON
    else:
        return jsonify({"success": False, "message": "Invalid stop type"}), 400

    try:
        # Load the existing data for the appropriate stop type
        stops = load_geojson_file(filepath)

        # Find the stop with the matching OBJECTID and update its coordinates
        for feature in stops['features']:
            if feature['properties']['OBJECTID'] == stop_id:
                feature['geometry']['coordinates'] = [new_lon, new_lat]
                feature['properties']['STOPLAT'] = new_lat
                feature['properties']['STOPLON'] = new_lon
                break

        # Save the updated data back to the file
        save_geojson_file(filepath, stops)

        return jsonify({"success": True, "message": f"{stop_type} location updated"}), 200
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    
@app.route('/delete-stop', methods=['DELETE'])
def delete_stop():
    data = request.get_json()
    stop_code = data.get('STOPCODE')
    stop_type = data.get('stopType')  # Get stop type (busStops or trainStations)

    # Determine the correct GeoJSON file based on stop type
    if stop_type == 'busStops':
        geojson_file = BUS_STOP_GEOJSON
    elif stop_type == 'trainStations':
        geojson_file = TRAIN_STATION_GEOJSON
    else:
        return jsonify({'success': False, 'message': 'Invalid stop type'}), 400

    # Load the GeoJSON data
    geojson_data = load_geojson_file(geojson_file)

    # Find the stop with the matching STOPCODE and remove it
    geojson_data['features'] = [feature for feature in geojson_data['features'] if feature['properties']['STOPCODE'] != stop_code]

    # Save the updated GeoJSON data
    save_geojson_file(geojson_file, geojson_data)

    return jsonify({"success": True, "message": "Stop deleted successfully"}), 200



if __name__ == '__main__':
    app.run(debug=True)
