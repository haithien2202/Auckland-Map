from flask import Flask, jsonify
from flask_cors import CORS
import geojson

app = Flask(__name__)
CORS(app)

@app.route('/api/bus-stops', methods=['GET'])
def get_bus_stops():
    # Path to your GeoJSON file for bus stops
    geojson_file = 'data/Bus_Stop.geojson'

    # Load the GeoJSON file
    with open(geojson_file) as f:
        data = geojson.load(f)

    # Extract features from GeoJSON
    bus_stop = []
    for feature in data['features']:
        stop = {
            'OBJECTID': feature['properties'].get('OBJECTID'),
            'STOPID': feature['properties'].get('STOPID'),
            'STOPCODE': feature['properties'].get('STOPCODE'),
            'STOPNAME': feature['properties'].get('STOPNAME'),
            'STOPDESC': feature['properties'].get('STOPDESC'),  # Added STOPDESC
            'LOCATIONTYPE': feature['properties'].get('LOCATIONTYPE'),  # Added LOCATIONTYPE
            'STOPLAT': feature['properties'].get('STOPLAT'),
            'STOPLON': feature['properties'].get('STOPLON'),
            'PARENTSTATION': feature['properties'].get('PARENTSTATION'),  # Added PARENTSTATION
            'MODE': feature['properties'].get('MODE'),
            'coordinates': feature['geometry']['coordinates']  # Extract the coordinates
        }
        bus_stop.append(stop)

    return jsonify(bus_stop)

@app.route('/api/train-stations', methods=['GET'])
def get_train_stations():
    # Path to the correct GeoJSON file for train stations
    geojson_file = 'data/train_station_data.geojson'  # Updated to the correct train station file

    # Load the GeoJSON file
    try:
        with open(geojson_file) as f:
            data = geojson.load(f)

        # Extract features from GeoJSON
        train_stations = []
        for feature in data['features']:
            station = {
                'OBJECTID': feature['properties'].get('OBJECTID'),
                'STOPID': feature['properties'].get('STOPID'),
                'STOPCODE': feature['properties'].get('STOPCODE'),
                'STOPNAME': feature['properties'].get('STOPNAME'),
                'STOPDESC': feature['properties'].get('STOPDESC'),  # Added STOPDESC
                'LOCATIONTYPE': feature['properties'].get('LOCATIONTYPE'),  # Added LOCATIONTYPE
                'STOPLAT': feature['properties'].get('STOPLAT'),
                'STOPLON': feature['properties'].get('STOPLON'),
                'PARENTSTATION': feature['properties'].get('PARENTSTATION'),  # Added PARENTSTATION
                'MODE': feature['properties'].get('MODE'),
                'coordinates': feature['geometry']['coordinates']  # Extract the coordinates
            }
            train_stations.append(station)

        return jsonify(train_stations)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
