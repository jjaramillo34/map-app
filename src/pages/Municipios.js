import React, { useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "../data/geojson.geojson";
import Layout from "../components/Layout";
import { ExternalLink, MapPin } from "lucide-react";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Municipios() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // set the initial state of the map to Puerto Rico
  const [lng] = useState(-66.5901);
  const [lat] = useState(18.2208);
  const [zoom] = useState(9);

  // read the data from the geojson file
  const [data, setData] = useState(null);

  // get the user's current location
  const [currentLocation] = useState(null);

  // municipality filter state
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  // Load geojson data
  useEffect(() => {
    const loadData = async () => {
      try {
        let dataToLoad = geoJson;
        
        // If it's a URL string, fetch it
        if (typeof dataToLoad === 'string' && (dataToLoad.startsWith('/') || dataToLoad.startsWith('http'))) {
          console.log("[Municipios] Fetching geojson from URL:", dataToLoad);
          const response = await fetch(dataToLoad);
          dataToLoad = await response.json();
        } else if (typeof dataToLoad === 'string') {
          // Try to parse as JSON
          try {
            dataToLoad = JSON.parse(dataToLoad);
          } catch (e) {
            console.error("[Municipios] Failed to parse geojson:", e);
          }
        }
        
        setData(dataToLoad);
      } catch (error) {
        console.error("[Municipios] Error loading geojson:", error);
      }
    };
    
    loadData();
  }, []);

  // fly to the user's current location
  const flytoLocation = () => {
    if (map.current && currentLocation) {
      map.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 14,
      });
    }
  };

  useEffect(() => {
    if (map.current || !data) return; // initialize map only once and wait for data

    // initialize the map object
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: [lng, lat],
      zoom: 14,
      bearing: 0,
      pitch: 0,
    });

    // add the controls to the map
    map.current.addControl(new mapboxgl.NavigationControl());
    // add full screen control
    map.current.addControl(new mapboxgl.FullscreenControl());
    // add geolocation control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }),
      "top-right"
    );

    // Geocoder removed - using municipality dropdown filter instead

    // add the marker to the map on click
    map.current.on("click", function (e) {
      // add a marker to the map
      var el = document.createElement("div");
      el.className = "marker";

      // make a marker for each feature and add it to the map
      new mapboxgl.Marker(el).setLngLat(e.lngLat).addTo(map.current);

      // set marker size and color
      el.style.width = "50px";
      el.style.height = "10px";
      el.style.borderRadius = "80%";
      el.style.backgroundColor = "blue";
      el.style.opacity = "0.5";

      // use the marker's name as the tooltip
      el.setAttribute("title", "Current Location");

      // add a popup to each Marker from the tilequery response distance street address
      // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
      el.addEventListener("click", function () {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            "<h3>" +
              "Current Location" +
              "</h3><p>" +
              "San Juan, Puerto Rico" +
              "</p>"
          )

          .addTo(map.current);
      });

      // add a popup to each Marker from the tilequery response distance street address
      // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
      el.addEventListener("mouseenter", function () {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            "<h3>" +
              "Current Location" +
              "</h3><p>" +
              "San Juan, Puerto Rico" +
              "</p>"
          )
          .addTo(map.current);
      });

      // add a popup to each Marker from the tilequery response distance street address
      // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/

      // add a popup to each Marker from the tilequery response distance street address
      // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
      el.addEventListener("click", function () {
        new mapboxgl.Popup()
          .setLngLat(e.result.center)
          .setHTML(
            "<h3>" + e.result.text + "</h3><p>" + e.result.place_name + "</p>"
          )

          .addTo(map.current);
      });
    });

    // add the current location marker to the map
    var el = document.createElement("div");
    el.className = "marker";

    // make a marker for each feature and add it to the map
    new mapboxgl.Marker(el).setLngLat([-66.5901, 18.2208]).addTo(map.current);

    // set marker size and color
    el.style.width = "10px";
    el.style.height = "10px";
    el.style.borderRadius = "80%";
    el.style.backgroundColor = "blue";
    el.style.opacity = "0.5";

    // use the marker's name as the tooltip
    el.setAttribute("title", "Current Location");

    // add a popup to each Marker from the tilequery response distance street address
    // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
    el.addEventListener("click", function () {
      new mapboxgl.Popup()
        .setLngLat([-66.5901, 18.2208])
        .setHTML(
          "<h3>" +
            "Current Location" +
            "</h3><p>" +
            "San Juan, Puerto Rico" +
            "</p>"
        )

        .addTo(map.current);
    });

    // add a popup to each Marker from the tilequery response distance street address
    // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
    el.addEventListener("mouseenter", function () {
      new mapboxgl.Popup()
        .setLngLat([-66.5901, 18.2208])
        .setHTML(
          "<h3>" +
            "Current Location" +
            "</h3><p>" +
            "San Juan, Puerto Rico" +
            "</p>"
        )
        .addTo(map.current);
    });

    // add a popup to each Marker from the tilequery response distance street address
    // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/

    // add a popup to each Marker from the tilequery response distance street address
    // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
    el.addEventListener("click", function () {
      new mapboxgl.Popup()
        .setLngLat([-66.5901, 18.2208])
        .setHTML(
          "<h3>" +
            "Current Location" +
            "</h3><p>" +
            "San Juan, Puerto Rico" +
            "</p>"
        )

        .addTo(map.current);
    });

    // Filter will be handled by React state change handler

    // add a geolocation control to the map

    // user the json response to add markers to the map
    const setupMapLayers = () => {
      if (!map.current) return;
      
      // Wait for data to be loaded
      if (!data) {
        console.log("[Municipios] Waiting for data to load...");
        return;
      }
      
      // Check if source already exists
      if (map.current.getSource("municipios")) {
        console.log("[Municipios] Updating existing source with new data");
        map.current.getSource("municipios").setData(data);
        return;
      }
      
      console.log("[Municipios] Adding municipios source to map");
      
      // insert the layer beneath any symbol layer 3D buildings
      var layers = map.current.getStyle().layers;
      var labelLayerId = layers.find(function (layer) {
        return layer.type === "symbol" && layer.layout["text-field"];
      })?.id;

      var radius = 1609.34 * 2;
      var limit = 50;

      // get the user's current location from the mapbox geolocation api
      // https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-geolocate/
      // https://docs.mapbox.com/help/tutorials/get-started-mapbox-gl-js/#add-geolocation
      map.current.addSource("user-location", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // add a layer to the map for the user's location
      map.current.addLayer({
        id: "user-location",
        source: "user-location",
        type: "circle",
        paint: {
          "circle-radius": 10,
          "circle-color": "#007cbf",
        },
      });

      // get the user's current location from the mapbox geolocation api
      // https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-geolocate/
      // https://docs.mapbox.com/help/tutorials/get-started-mapbox-gl-js/#add-geolocation
      var geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      });

      // add the geolocation control to the map

      // listen for the geolocate event and add the user's location to the map
      geolocate.on("geolocate", function (e) {
        console.log("geolocate: ", e);
        var lon = e.coords.longitude;
        var lat = e.coords.latitude;

        // add the user's location to the map
        map.current.getSource("user-location").setData({
          type: "Point",
          coordinates: [lon, lat],
        });

        // fly to the user's current location
        map.current.flyTo({
          center: [lon, lat],
          zoom: 14,
        });
      });

      // get the lat from the id of the map container
      //var lat = document.getElementById("geolocate").coords.latitude;
      // get the lng from the id of the map container
      //var lng = document.getElementById("map-container").coords.longitude;
      var lat = 18.4296539;
      var lng = -66.7571467;

      // fly to the user's current location
      map.current.flyTo({
        center: [lng, lat],
        zoom: 9,
      });

      // example api call
      //api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/-105.01109,39.75953.json?radius=1000&limit=10&access_token=pk.eyJ1IjoiamphcmFtaWxsbzM0IiwiYSI6ImZiNjc3OWVmMDE3MTc1YjMxMzM1NzYyY2RlYmM3NjgzIn0.qaxSS4Q_tNwUlXHNZPq2zQ

      var query = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json`;

      query =
        query +
        "?access_token=" +
        mapboxgl.accessToken +
        "&limit=" +
        limit +
        "&radius=" +
        radius +
        "&proximity=" +
        lng +
        "," +
        lat;

      console.log(query);
      // run the query and add the markers to the map
      fetch(query)
        .then((response) => response.json())
        .then((data) => {
          console.log("data inside: ", data);
          // add markers to map
          data.features.forEach(function (marker) {
            // create a HTML element for each feature
            var el = document.createElement("div");
            el.className = "marker";

            // make a marker for each feature and add it to the map
            new mapboxgl.Marker(el)
              .setLngLat(marker.geometry.coordinates)
              .addTo(map.current);

            // set marker size and color
            el.style.width = "10px";
            el.style.height = "10px";
            el.style.borderRadius = "80%";
            el.style.backgroundColor = "red";
            el.style.opacity = "0.5";

            // use the marker's name as the tooltip
            el.setAttribute("title", marker.properties.Street);

            var street = marker.properties.Street;
            var address = marker.properties.Address;
            // convert the distance to kilometers and round to 0 decimal places
            var distancemiles = marker.properties.tilequery.distance;
            var distance = (distancemiles * 1.60934).toFixed(0) + " km";

            //console.log("distance: ", distance);

            // add a popup to each Marker from the tilequery response distance street address
            // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
            el.addEventListener("click", function () {
              new mapboxgl.Popup()
                .setLngLat(marker.geometry.coordinates)
                .setHTML(
                  "<h3>" +
                    street +
                    "</h3><p>" +
                    address +
                    "</p>" +
                    "<p>" +
                    distance +
                    "</p>"
                )

                .addTo(map.current);
            });

            // add a popup to each Marker from the tilequery response distance street address
            // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
            el.addEventListener("mouseenter", function () {
              new mapboxgl.Popup()
                .setLngLat(marker.geometry.coordinates)
                .setHTML(
                  "<h3>" +
                    street +
                    "</h3><p>" +
                    address +
                    "</p>" +
                    "<p>" +
                    distance +
                    "</p>"
                )
                .addTo(map.current);
            });

            // add a popup to each Marker from the tilequery response distance street address
            // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/

            // add a popup to each Marker from the tilequery response distance street address
            // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
            el.addEventListener("click", function () {
              new mapboxgl.Popup()
                .setLngLat(marker.geometry.coordinates)
                .setHTML(
                  "<h3>" +
                    street +
                    "</h3><p>" +
                    address +
                    "</p>" +
                    "<p>" +
                    distance +
                    "</p>"
                )

                .addTo(map.current);
            });
          });
        });

      // add the geojson data to the map
      if (data && data.features && data.features.length > 0) {
        try {
          map.current.addSource("municipios", {
            type: "geojson",
            data: data,
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
          });
        } catch (error) {
          console.error("[Municipios] Error adding source:", error);
          return;
        }
      } else {
        console.warn("[Municipios] No valid geojson data to add to map");
        return;
      }

      map.current.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );

      // Add cluster layers if clustering is enabled
      if (!map.current.getLayer("municipios-clusters")) {
        map.current.addLayer({
          id: "municipios-clusters",
          type: "circle",
          source: "municipios",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              100,
              "#1F4298",
              750,
              "#FF6800",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
            ],
          },
        });
      }

      if (!map.current.getLayer("municipios-cluster-count")) {
        map.current.addLayer({
          id: "municipios-cluster-count",
          type: "symbol",
          source: "municipios",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });
      }

      // Add a layer for municipios points (unclustered)
      if (!map.current.getLayer("municipios-points")) {
        map.current.addLayer({
          id: "municipios-points",
          type: "circle",
          source: "municipios",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#FF6800",
            "circle-radius": 6,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
      }
    };
    
    // Set up layers when map loads
    const loadHandler = () => {
      setupMapLayers();
    };
    
    map.current.on("load", loadHandler);
    
    // Also try to set up layers if map is already loaded and we have data
    if (map.current.isStyleLoaded() && data) {
      setupMapLayers();
    }
    
    return () => {
      if (map.current) {
        map.current.off("load", loadHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Handle municipality filter change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !data) return;
    
    console.log("[Municipios] Filtering by municipality:", selectedMunicipality);
    
    // Create filter that checks both County and Municipio properties
    const filter = selectedMunicipality
      ? [
          "any",
          [
            "match",
            [
              "replace",
              ["get", "County"],
              " Municipio",
              ""
            ],
            [selectedMunicipality],
            true,
            false,
          ],
          [
            "match",
            ["get", "Municipio"],
            [selectedMunicipality],
            true,
            false,
          ],
          [
            "match",
            ["get", "City"],
            [selectedMunicipality],
            true,
            false,
          ],
        ]
      : null;

    // Apply filter to unclustered points
    if (map.current.getLayer("municipios-points")) {
      if (filter) {
        map.current.setFilter("municipios-points", [
          "all",
          ["!", ["has", "point_count"]],
          filter,
        ]);
        console.log("[Municipios] Applied filter to municipios-points");
      } else {
        map.current.setFilter("municipios-points", ["!", ["has", "point_count"]]);
        console.log("[Municipios] Removed filter from municipios-points");
      }
    }

    // Apply filter to clusters
    if (map.current.getLayer("municipios-clusters")) {
      if (filter) {
        map.current.setFilter("municipios-clusters", [
          "all",
          ["has", "point_count"],
          filter,
        ]);
        console.log("[Municipios] Applied filter to municipios-clusters");
      } else {
        map.current.setFilter("municipios-clusters", ["has", "point_count"]);
        console.log("[Municipios] Removed filter from municipios-clusters");
      }
    }

    // Apply filter to cluster count labels
    if (map.current.getLayer("municipios-cluster-count")) {
      if (filter) {
        map.current.setFilter("municipios-cluster-count", [
          "all",
          ["has", "point_count"],
          filter,
        ]);
        console.log("[Municipios] Applied filter to municipios-cluster-count");
      } else {
        map.current.setFilter("municipios-cluster-count", ["has", "point_count"]);
        console.log("[Municipios] Removed filter from municipios-cluster-count");
      }
    }

    // Zoom to filtered municipality if one is selected
    if (selectedMunicipality && data && data.features) {
      // Find all features matching the selected municipality
      const matchingFeatures = data.features.filter((feature) => {
        const county = feature.properties?.County?.replace(" Municipio", "").trim();
        const municipio = feature.properties?.Municipio;
        const city = feature.properties?.City;
        return county === selectedMunicipality || 
               municipio === selectedMunicipality || 
               city === selectedMunicipality;
      });

      if (matchingFeatures.length > 0) {
        // Calculate bounding box of matching features
        const coordinates = matchingFeatures
          .map(f => f.geometry?.coordinates)
          .filter(c => c && Array.isArray(c) && c.length >= 2);

        if (coordinates.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          coordinates.forEach(([lng, lat]) => {
            bounds.extend([lng, lat]);
          });

          // Fly to the bounds with some padding
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 12,
            duration: 1000
          });
          
          console.log(`[Municipios] Zoomed to ${matchingFeatures.length} features in ${selectedMunicipality}`);
        }
      }
    } else if (!selectedMunicipality) {
      // Reset to default view when no municipality is selected
      map.current.flyTo({
        center: [lng, lat],
        zoom: 9,
        duration: 1000
      });
    }
  }, [selectedMunicipality, data, lng, lat]);

  const copyLocation = () => {
    try {
      navigator.clipboard.writeText(
        `Latitude: ${lat} | Longitude: ${lng} | Zoom: ${zoom}`
      );
      alert("Location copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // add a dropdown with the municipalities of puerto rico, and filter the map
  // based on the municipality selected

  return (
    <Layout showFooter={false}>
      <div className="relative w-full h-full overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
        {/* Municipality Dropdown */}
        <div
          className="absolute top-4 left-4 z-10 bg-white/98 backdrop-blur-md rounded-lg shadow-lg border border-black/5 flex items-center gap-2"
        >
          <div className="px-4 py-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-600" />
            <select
              id="municipality"
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
            <option value="">Seleccionar municipio</option>
          <option value="Aguada">Aguada</option>
          <option value="Aguadilla">Aguadilla</option>
          <option value="Aguas Buenas">Aguas Buenas</option>
          <option value="Aibonito">Aibonito</option>
          <option value="Añasco">Añasco</option>
          <option value="Arecibo">Arecibo</option>
          <option value="Arroyo">Arroyo</option>
          <option value="Barceloneta">Barceloneta</option>
          <option value="Barranquitas">Barranquitas</option>
          <option value="Bayamón">Bayamón</option>
          <option value="Cabo Rojo">Cabo Rojo</option>
          <option value="Caguas">Caguas</option>
          <option value="Camuy">Camuy</option>
          <option value="Canóvanas">Canóvanas</option>
          <option value="Carolina">Carolina</option>
          <option value="Cataño">Cataño</option>
          <option value="Cayey">Cayey</option>
          <option value="Ceiba">Ceiba</option>
          <option value="Ciales">Ciales</option>
          <option value="Cidra">Cidra</option>
          <option value="Coamo">Coamo</option>
          <option value="Comerío">Comerío</option>
          <option value="Corozal">Corozal</option>
          <option value="Culebra">Culebra</option>
          <option value="Dorado">Dorado</option>
          <option value="Fajardo">Fajardo</option>
          <option value="Florida">Florida</option>
          <option value="Guánica">Guánica</option>
          <option value="Guayama">Guayama</option>
          <option value="Guayanilla">Guayanilla</option>
          <option value="Guaynabo">Guaynabo</option>
          <option value="Gurabo">Gurabo</option>
          <option value="Hatillo">Hatillo</option>
          <option value="Hormigueros">Hormigueros</option>
          <option value="Humacao">Humacao</option>
          <option value="Isabela">Isabela</option>
          <option value="Jayuya">Jayuya</option>
          <option value="Juana Díaz">Juana Díaz</option>
          <option value="Juncos">Juncos</option>
          <option value="Lajas">Lajas</option>
          <option value="Lares">Lares</option>
          <option value="Las Marías">Las Marías</option>
          <option value="Las Piedras">Las Piedras</option>
          <option value="Loíza">Loíza</option>
          <option value="Luquillo">Luquillo</option>
          <option value="Manatí">Manatí</option>
          <option value="Maricao">Maricao</option>
          <option value="Maunabo">Maunabo</option>
          <option value="Mayagüez">Mayagüez</option>
          <option value="Moca">Moca</option>
          <option value="Morovis">Morovis</option>
          <option value="Naguabo">Naguabo</option>
          <option value="Naranjito">Naranjito</option>
          <option value="Orocovis">Orocovis</option>
          <option value="Patillas">Patillas</option>
          <option value="Peñuelas">Peñuelas</option>
          <option value="Ponce">Ponce</option>
          <option value="Quebradillas">Quebradillas</option>
          <option value="Rincón">Rincón</option>
          <option value="Río Grande">Río Grande</option>
          <option value="Sabana Grande">Sabana Grande</option>
          <option value="Salinas">Salinas</option>
          <option value="San Germán">San Germán</option>
          <option value="San Juan">San Juan</option>
          <option value="San Lorenzo">San Lorenzo</option>
          <option value="San Sebastián">San Sebastián</option>
          <option value="Santa Isabel">Santa Isabel</option>
          <option value="Toa Alta">Toa Alta</option>
          <option value="Toa Baja">Toa Baja</option>
          <option value="Trujillo Alto">Trujillo Alto</option>
          <option value="Utuado">Utuado</option>
          <option value="Vega Alta">Vega Alta</option>
          <option value="Vega Baja">Vega Baja</option>
          <option value="Vieques">Vieques</option>
          <option value="Villalba">Villalba</option>
          <option value="Yabucoa">Yabucoa</option>
          <option value="Yauco">Yauco</option>
        </select>
          </div>
          {selectedMunicipality && (
            <Link
              to={`/municipio/${encodeURIComponent(selectedMunicipality)}`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Detalles
            </Link>
          )}
        </div>

        {/* Location Info Panel */}
        <div
          className="absolute bottom-4 md:bottom-8 left-4 md:left-8 z-10 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl min-w-[280px] overflow-hidden border border-black/5 md:max-w-none max-w-[calc(100vw-2rem)]"
        >
          <div className="px-4 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <h3 className="m-0 text-base font-semibold tracking-wide">Map Information</h3>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Longitude</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{lng}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Latitude</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{lat}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-black/5 last:border-b-0 last:mb-3">
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Zoom</span>
              <span className="text-sm text-gray-900 font-semibold font-mono">{zoom}</span>
            </div>
            <button
              onClick={copyLocation}
              title="Copy location"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 mt-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/40 active:translate-y-0"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2C4 1.44772 4.44772 1 5 1H11C11.5523 1 12 1.44772 12 2V6H13C13.5523 6 14 6.44772 14 7V13C14 13.5523 13.5523 14 13 14H7C6.44772 14 6 13.5523 6 13V12H5C4.44772 12 4 11.5523 4 11V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6H7C6.44772 6 6 6.44772 6 7V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copy
            </button>
          </div>
        </div>

        {currentLocation && (
          <button
            onClick={flytoLocation}
            title="Fly to my location"
            className="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-10 flex items-center gap-2 py-3.5 px-6 bg-white/98 backdrop-blur-md border border-black/5 rounded-xl text-sm md:text-base font-semibold text-gray-900 cursor-pointer transition-all duration-200 shadow-lg hover:-translate-y-0.5 hover:shadow-xl hover:bg-white active:translate-y-0"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-500">
              <path d="M10 2C10 2 4 6 4 10C4 12.5 6.5 15 10 15C13.5 15 16 12.5 16 10C16 6 10 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            My Location
          </button>
        )}

        {/* Map Container */}
        <div className="absolute top-0 left-0 w-full h-full z-[1]" ref={mapContainer} />
      </div>
    </Layout>
  );
}
