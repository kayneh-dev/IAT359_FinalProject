import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [favourites, setFavourites] = useState([]);

  async function updateLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Location permission denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log(location);
    setCurrentLocation(location);
    updateStops(location.coords.latitude, location.coords.longitude);
  }

  async function updateStops(lat, lng) {
    const query = `[out:json];node["highway"="bus_stop"](around:500,${lat},${lng});out;`;
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
      const response = await fetch( url, { headers: { "User-Agent": "CommuteCast-student-app" }} );
      const data = await response.json();
      console.log("stops found: " + data.elements.length);
      setStops(data.elements);
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  }
  
  async function saveFavourite() {
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

  useEffect( () => { 
    updateLocation(); 
    updateFavourites(); 
  } , [] );


  return (
    <View style={styles.container}>
      {currentLocation ?

        (<MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
          />
          {stops.filter((stop) => favourites.filter((fav) => fav.lat === stop.lat && fav.lng === stop.lon).length === 0)
            .map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lon }}
              title={stop.tags.name}
              description={stop.tags.route_ref}
              pinColor="blue"
              onPress={() => setSelectedStop(stop)}
              
            />
          ))}
          {favourites.map((fav) => (<Marker key={fav.id} coordinate={{ latitude: fav.lat, longitude: fav.lng }}
            title={fav.name} pinColor="green" zIndex={1} />))}
        </MapView>)

        : (<Text>getting location...</Text>)}
      {selectedStop ? (
        <View>
          <Text>{selectedStop.tags.name}</Text>
          <Text>Stop number: {selectedStop.tags.ref}</Text>
          <Text>Routes: {selectedStop.tags.route_ref}</Text>
          <Button title="Save to favourites" onPress={saveFavourite} />
        </View>
      ) : null}
      <FlatList
        data={stops}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedStop(item)}>
            <Text>{item.tags.name} ({item.tags.ref})</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create( { container: { flex: 1, padding: 20 } , map: { width: "100%", height: 300 } } );