# save as fetch_boundaries.py and run
import osmnx as ox
import geopandas as gpd
import json

ox.settings.use_cache = True
ox.settings.log_console = True

# Method 1: Get Port Louis district boundary
place = "Port Louis, Mauritius"
try:
    port_louis = ox.geocode_to_gdf(place)
    port_louis.to_file("portlouis_boundary.geojson", driver="GeoJSON")
    print(f"Port Louis boundary saved")
except Exception as e:
    print(f"Error: {e}")

# Method 2: Get neighborhoods in Port Louis
try:
    # Get all administrative boundaries in Port Louis area
    tags = {'boundary': 'administrative'}
    gdf = ox.features_from_place(place, tags)
    
    # Filter for sub-districts
    admin_areas = gdf[gdf['boundary'] == 'administrative']
    admin_areas.to_file("portlouis_administrative.geojson", driver="GeoJSON")
    print(f"Administrative areas saved")
except Exception as e:
    print(f"Error: {e}")

# Method 3: Get by bounding box (Port Louis area)
try:
    # Bounding box for Port Louis
    north, south, east, west = -20.10, -20.22, 57.55, 57.47
    tags = {'boundary': 'administrative', 'admin_level': '8'}
    neighborhoods = ox.features_from_bbox(west, south, east, north, tags)
    neighborhoods.to_file("portlouis_neighborhoods.geojson", driver="GeoJSON")
    print(f"Neighborhood boundaries saved")
except Exception as e:
    print(f"Error: {e}")

print("Done! Check the generated GeoJSON files.")