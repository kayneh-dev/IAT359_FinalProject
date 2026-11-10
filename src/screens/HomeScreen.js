import { useCallback, useMemo, useState } from "react";
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db, firebase_auth } from "../firebaseConfig";

// No API key needed for Open-Meteo's public, non-commercial weather API.
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=49.2827&longitude=-123.1207" +
  "&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&timezone=America%2FVancouver";

function weatherDescription(code) {
  if (code === 0) return "Clear sky";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rain or drizzle";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Conditions unavailable";
}

function weatherAdvice(code) {
  if (code >= 51 && code <= 67) return "Consider bringing an umbrella.";
  if (code >= 80 && code <= 82)
    return "Rain showers are possible. Bring a jacket.";
  if (code >= 71 && code <= 77) return "Allow extra time for winter weather.";
  if (code === 45 || code === 48) return "Be careful around traffic in fog.";
  return "Check the forecast before heading out.";
}

// Find the next occurrence of a recurring commute in the phone's local time.
function getNextDeparture(commute, now) {
  if (!Array.isArray(commute.days) || typeof commute.time !== "string")
    return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(commute.time);
  if (!match) return null;

  for (let offset = 0; offset <= 7; offset++) {
    const departure = new Date(now);
    departure.setDate(now.getDate() + offset);
    departure.setHours(Number(match[1]), Number(match[2]), 0, 0);

    if (
      commute.days.includes(departure.getDay()) &&
      departure.getTime() > now.getTime()
    ) {
      return departure;
    }
  }
  return null;
}

function dateLabel(date, now) {
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, now)) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function HomeScreen({ navigation, color }) {
  const user = firebase_auth.currentUser;
  const uid = user?.uid;
  const firstName = user?.displayName?.trim().split(" ")[0] || "there";

  const [commutes, setCommutes] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [error, setError] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [now, setNow] = useState(new Date());
  const [refreshNumber, setRefreshNumber] = useState(0);

  // Reload when the Home tab becomes focused, or Refresh is pressed.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setNow(new Date());

      async function loadCommutes() {
        setLoading(true);
        setError("");
        if (!uid) {
          if (active) {
            setError("Please sign in to view your commutes.");
            setCommutes([]);
            setLoading(false);
          }
          return;
        }
        try {
          const snapshot = await getDocs(
            collection(db, "users", uid, "commutes"),
          );
          const list = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }));
          if (active) setCommutes(list);
        } catch (err) {
          console.log("Home commutes failed:", err);
          if (active) setError("Could not load commutes: " + err.message);
        } finally {
          if (active) setLoading(false);
        }
      }

      async function loadWeather() {
        setWeatherLoading(true);
        setWeatherError("");
        try {
          const response = await fetch(WEATHER_URL);
          if (!response.ok)
            throw new Error("Weather server returned " + response.status);
          const data = await response.json();
          if (!data.current) throw new Error("Weather data is missing");
          if (active) setWeather(data.current);
        } catch (err) {
          console.log("Weather request failed:", err);
          if (active) {
            setWeather(null);
            setWeatherError("Could not load weather. Check your connection.");
          }
        } finally {
          if (active) setWeatherLoading(false);
        }
      }

      loadCommutes();
      loadWeather();
      const timer = setInterval(() => setNow(new Date()), 60000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [uid, refreshNumber]),
  );

  const upcoming = useMemo(() => {
    return commutes
      .map((commute) => ({
        ...commute,
        nextDeparture: getNextDeparture(commute, now),
      }))
      .filter((commute) => commute.nextDeparture !== null)
      .sort((a, b) => a.nextDeparture - b.nextDeparture);
  }, [commutes, now]);

  const next = upcoming[0];
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headingRow}>
        <View>
          <Text style={[styles.title, { color }]}>
            {greeting}, {firstName}!
          </Text>
          <Text style={styles.subtitle}>Plan your day with CommuteCast.</Text>
        </View>
        <Pressable onPress={() => setRefreshNumber((value) => value + 1)}>
          <Text style={[styles.actionText, { color }]}>Refresh</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Next planned commute</Text>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={color} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : next ? (
          <>
            <Text style={[styles.highlightName, { color }]}>{next.name}</Text>
            <Text style={styles.route}>
              {next.origin} → {next.destination}
            </Text>
            <Text style={styles.bigTime}>{next.time}</Text>
            <Text style={styles.muted}>
              {dateLabel(next.nextDeparture, now)} · Planned departure
            </Text>
            <Text style={styles.note}>
              This is your saved schedule, not a live bus arrival.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.muted}>No upcoming commutes found.</Text>
            <Text style={styles.note}>Use Schedule to add a regular trip.</Text>
          </>
        )}
        <Pressable
          style={[styles.primaryButton, { backgroundColor: color }]}
          onPress={() => navigation.navigate("Schedule")}
        >
          <Text style={styles.primaryButtonText}>Manage schedule</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Vancouver weather now</Text>
      <View style={styles.card}>
        {weatherLoading ? (
          <ActivityIndicator color={color} />
        ) : weatherError ? (
          <Text style={styles.errorText}>{weatherError}</Text>
        ) : weather ? (
          <>
            <Text style={styles.bigTime}>
              {Math.round(weather.temperature_2m)}°C
            </Text>
            <Text style={styles.route}>
              {weatherDescription(weather.weather_code)}
            </Text>
            <Text style={styles.muted}>
              Feels like {Math.round(weather.apparent_temperature)}°C
              {"  ·  "}Wind {Math.round(weather.wind_speed_10m)} km/h
            </Text>
            <Text style={styles.note}>
              {weatherAdvice(weather.weather_code)}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>Weather is unavailable.</Text>
        )}
        <Text style={styles.source}>Weather: Open-Meteo · Vancouver, BC</Text>
      </View>

      <View style={styles.headingRow}>
        <Text style={styles.sectionTitle}>Upcoming saved commutes</Text>
        <Text style={styles.muted}>{commutes.length} saved</Text>
      </View>

      {!loading && !error && upcoming.length === 0 && (
        <Text style={styles.emptyText}>
          Your regular commutes will appear here.
        </Text>
      )}

      {!loading &&
        upcoming.slice(0, 3).map((commute) => (
          <View key={commute.id} style={styles.smallCard}>
            <View style={styles.headingRow}>
              <Text style={styles.commuteName}>{commute.name}</Text>
              <Text style={[styles.actionText, { color }]}>{commute.time}</Text>
            </View>
            <Text style={styles.muted}>
              {commute.origin} → {commute.destination}
            </Text>
            <Text style={styles.muted}>
              {dateLabel(commute.nextDeparture, now)}
            </Text>
          </View>
        ))}

      <Text style={styles.note}>
        Live TransLink departures are not connected to this dashboard yet.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },
  content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 36 },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 25, fontWeight: "bold" },
  subtitle: { color: "grey", marginTop: 5, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  card: {
    borderRadius: 12,
    padding: 17,
    borderWidth: 1,
    borderColor: "lightgrey",
    marginBottom: 22,
    backgroundColor: "white",
  },
  smallCard: {
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "lightgrey",
    marginBottom: 10,
    backgroundColor: "white",
  },
  highlightName: { fontSize: 19, fontWeight: "bold" },
  route: { fontSize: 15, marginTop: 7, color: "black" },
  bigTime: { fontSize: 34, fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  muted: { color: "grey", marginTop: 4 },
  note: { fontSize: 12, color: "grey", marginTop: 11 },
  source: { fontSize: 11, color: "grey", marginTop: 14 },
  primaryButton: {
    marginTop: 17,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 12,
  },
  primaryButtonText: { fontWeight: "bold", color: "white" },
  commuteName: { fontWeight: "bold", fontSize: 15 },
  actionText: { fontWeight: "bold" },
  emptyText: { color: "grey", textAlign: "center", paddingVertical: 18 },
  errorText: { color: "red" },
});
