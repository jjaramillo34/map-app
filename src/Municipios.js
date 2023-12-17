import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import geoJson from "./geojson.geojson";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Municipios() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // set the initial state of the map to Puerto Rico
  const [lng, setLng] = useState(-66.5901);
  const [lat, setLat] = useState(18.2208);
  const [zoom, setZoom] = useState(9);

  // read the data from the geojson file
  const [data, setData] = useState(geoJson);

  // get the user's current location
  const [currentLocation, setCurrentLocation] = useState(null);

  // fly to the user's current location
  const flytoLocation = () => {
    map.current.flyTo({
      center: [currentLocation?.lng, currentLocation?.lat],
      zoom: 14,
    });
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once

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

    // add the geocoder control to the map and place the marker on the map
    map.current.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: "Search for places in Puerto Rico",
        countries: "pr",
      }),
      "top-left"
    );

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

    // add a dropdown with the municipalities of puerto rico, and filter the map
    // based on the municipality selected
    const select = document.getElementById("municipality");
    select.addEventListener("change", function (event) {
      var selectedMunicipality = event.target.value;
      console.log(selectedMunicipality);
      map.current.setFilter("municipios", [
        "match",
        ["get", "Municipio"],
        [selectedMunicipality],
        true,
        false,
      ]);
    });

    // add a geolocation control to the map

    // user the json response to add markers to the map
    map.current.on("load", function () {
      // insert the layer beneath any symbol layer 3D buildings
      var layers = map.current.getStyle().layers;
      var labelLayerId = layers.find(function (layer) {
        return layer.type === "symbol" && layer.layout["text-field"];
      }).id;

      var titelet = "jjaramillo34.cloeflk5g14182bpfmhujd1yn-58rvd";
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
        var accuracy = e.coords.accuracy;

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
      map.current.addSource("municipios", {
        type: "geojson",
        data: data,
        zoom: 9,

        // cluster: true,
        // clusterMaxZoom: 14, // Max zoom to cluster points on
        // clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)

        // cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
        clusterProperties: {
          // keep separate counts for each magnitude category in a cluster
          Municipio: ["+", ["case", ["has", "Municipio"], 1, 0]],
        },
      });

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
    });
  }, []);

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
    <div
      className="container"
      style={{
        height: "100vh",
        width: "100%",
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "1",
      }}
    >
      <div
        className="title"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.8",
        }}
      >
        <h1>Power Solar Map</h1>
        <h2>Clientes de Energía Solar en Puerto Rico</h2>
      </div>
      <div
        className="sidebar"
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.9",
        }}
      >
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        <span
          className="copy-icon"
          role="img"
          aria-label="copy"
          style={{
            cursor: "pointer",
            marginLeft: "10px",
            fontSize: "1.5em",
          }}
          onClick={copyLocation}
        >
          📋
        </span>
      </div>
      <div
        className="flyto"
        // style the button to the right of the map bottom
        style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.9",
        }}
      >
        <button onClick={flytoLocation}>Fly to my location</button>
      </div>

      <div
        className="dropdown"
        id="municipality"
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          zIndex: "2",
          padding: "10px",
          backgroundColor: "white",
          opacity: "0.9",
        }}
      >
        <select
          id="municipality"
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            zIndex: "2",
            padding: "10px",
            backgroundColor: "white",
            opacity: "0.9",
          }}
        >
          <option value="">Select a municipality</option>
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
      <div
        className="map-container"
        ref={mapContainer}
        style={{
          height: "100vh",
          width: "100%",
          position: "absolute",
          top: "0",
          left: "0",
          zIndex: "1",
        }}
      />
    </div>
  );
}
