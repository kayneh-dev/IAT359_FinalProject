import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { addDoc, collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { routeNames } from "../translinkRoutes";

export default function MapScreen({ color }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [region, setRegion] = useState(null);
  const [buses, setBuses] = useState([]);

  async function updateLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Location permission denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log(location);
    setCurrentLocation(location);
    setRegion({ latitude: location.coords.latitude, longitude: location.coords.longitude,
      latitudeDelta: 0.01, longitudeDelta: 0.01 });
    updateStops(location.coords.latitude, location.coords.longitude);
    updateBuses(location.coords.latitude, location.coords.longitude);
  }

  async function updateStops(lat, lng) {
    const query = `[out:json];node["highway"="bus_stop"](around:500,${lat},${lng});out;`;
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
      const response = await fetch( url, { headers: { "User-Agent": "CommuteCast-student-app" }} );
      if(!response.ok){
        alert("Bus stop server is busy, try again");
        return;
      }
      const data = await response.json();
      console.log("stops found: " + data.elements.length);
      setStops(data.elements);
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  }

  async function updateBuses(lat, lng){
    try {
      const response = await fetch("https://gtfsapi.translink.ca/v3/gtfsposition?apikey=" + process.env.EXPO_PUBLIC_TRANSLINK_KEY);
      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      const list = [];
      feed.entity.forEach((e) => {
        if(Math.abs(e.vehicle.position.latitude - lat) < 0.01 && Math.abs(e.vehicle.position.longitude - lng) < 0.015){
          list.push({ label: e.vehicle.vehicle.label, route: routeNames[e.vehicle.trip.routeId] || e.vehicle.trip.routeId,
            lat: e.vehicle.position.latitude, lng: e.vehicle.position.longitude });
        }
      });
      console.log("buses found: " + list.length);
      setBuses(list);
    } catch (error) {
      console.log(error.message);
    }
  }

  async function saveFavourite() {
    if(favourites.filter((fav) => fav.lat === selectedStop.lat
      && fav.lng === selectedStop.lon).length > 0){
      alert("Already saved");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "favourites"), { name: selectedStop.tags.name || "", ref: selectedStop.tags.ref || "",
        routes: selectedStop.tags.route_ref || "", lat: selectedStop.lat, lng: selectedStop.lon });
      console.log("saved: " + docRef.id);
      alert("Saved " + selectedStop.tags.name);
      updateFavourites();
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  }

  async function updateFavourites() {
    try {
      const querySnapshot = await getDocs(collection(db, "favourites"));
      const list = [];
      querySnapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
      setFavourites(list);
    } catch (error) {
      console.log(error.message);
    }
  }

  function moveToFavourite(fav){
    setRegion({ latitude: fav.lat, longitude: fav.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 });
  }

  async function deleteFavourite(id){
    try {
      await deleteDoc(doc(db, "favourites", id));
      updateFavourites();
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  }

  useEffect( () => { 
    updateLocation(); 
    updateFavourites();
  } , [] );

  useEffect( () => {
    if(currentLocation === null){
      return;
    }
    const timer = setInterval(() => updateBuses(currentLocation.coords.latitude, currentLocation.coords.longitude), 10000);
    return () => clearInterval(timer);
  } , [currentLocation] );


  return (
    <View style={styles.container}>
      {currentLocation ?

        (<MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={(r) => setRegion(r)}
          showsUserLocation
        >
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
          />

          {stops.filter((stop) => favourites.filter((fav) => fav.lat === stop.lat && fav.lng === stop.lon).length === 0)
            .map((stop) => {
            return (<Marker key={stop.id} coordinate={{ latitude: stop.lat, longitude: stop.lon }}
              title={stop.tags.name} description={stop.tags.route_ref} pinColor={color} onPress={() => setSelectedStop(stop)} />);
          })}

          {favourites.map((fav) => {
            return (<Marker key={fav.id} coordinate={{ latitude: fav.lat, longitude: fav.lng }}
              title={fav.name} pinColor="gold" zIndex={1} />);
          })}

          {buses.map((bus, i) => {

              return (<Marker key={i} coordinate={{ latitude: bus.lat, longitude: bus.lng }}
                title={"Route " + bus.route} description={"Bus " + bus.label}>
                <View style={styles.bus} collapsable={false}>
                  <Text style={styles.busIcon}>🚌</Text>
                  <Text style={styles.busText}>{bus.route}</Text>
                </View>
              </Marker>);
              
            }
          )}
        </MapView>)

        : (<Text>getting location...</Text>)}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedStop ? (
            <View style={styles.section}>
              <Text style={styles.stopName}>{selectedStop.tags.name}</Text>
              <Text style={styles.stopInfo}>Stop #{selectedStop.tags.ref}</Text>
              <Text style={styles.stopInfo}>Routes: {selectedStop.tags.route_ref}</Text>
              <Pressable style={[styles.button, { borderColor: color }]} onPress={saveFavourite}>
                <Text style={[styles.buttonText, { color }]}>Save Stop</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.heading}>Saved stops</Text>
          {favourites.map((item) => (
            <View key={item.id} style={styles.row}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => moveToFavourite(item)}>
                <Text>{item.name} ({item.ref})</Text>
              </TouchableOpacity>
              <Pressable style={[styles.smallButton, { borderColor: color }]} onPress={() => deleteFavourite(item.id)}>
                <Text style={[styles.buttonText, { color }]}>Delete</Text>
              </Pressable>
            </View>
          ))}

          <Text style={styles.heading}>Nearby stops</Text>
          {stops.map((item) => (
            <TouchableOpacity key={item.id} style={styles.row} onPress={() => setSelectedStop(item)}>
              <Text>{item.tags.name} ({item.tags.ref})</Text>
            </TouchableOpacity>
          ))}

          <Pressable style={[styles.button, { borderColor: color }]} onPress={updateLocation}>
            <Text style={[styles.buttonText, { color }]}>Refresh stops</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  map: { flex: 1 },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: "40%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  section: { marginBottom: 12 },
  stopName: { fontSize: 18, fontWeight: "bold" },
  stopInfo: { color: "grey", marginTop: 2 },
  heading: { fontSize: 16, fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  button: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  smallButton: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  buttonText: { fontWeight: "bold" },
  bus: { alignItems: "center", backgroundColor: "white", borderRadius: 3, paddingHorizontal: 1 },
  busIcon: { fontSize: 11, lineHeight: 13 },
  busText: { fontSize: 7, fontWeight: "bold", lineHeight: 8 },
});
