import {createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,} from "firebase/auth";
import {useState} from "react";
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View,} from "react-native";
import {firebase_auth} from "../firebaseConfig";

export default function SignInScreen() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const auth = firebase_auth;

  async function handleSignUp() {
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(response.user, { displayName: name });
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  }

  async function handleSignIn() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <Text style={styles.logo}>CommuteCast</Text>
        <Text style={styles.tagline}>Your weather-aware transit planner</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>{isSignUp ? "New account" : "Log in"}</Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? "Save your places. Plan your everyday journeys."
            : "Welcome back."}
        </Text>

        {isSignUp && (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder={isSignUp ? "At least 8 characters" : "Your password"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isSignUp && (
          <>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
          </>
        )}

        <Pressable
          style={styles.button}
          onPress={isSignUp ? handleSignUp : handleSignIn}
        >
          <Text style={styles.buttonText}>
            {isSignUp ? "Create Account" : "Log In"}
          </Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isSignUp ? "Already have an account? " : "New here? "}
          </Text>
          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.link}>{isSignUp ? "Log In" : "Sign Up"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    backgroundColor: "#B8243A",
    paddingTop: 80,
    paddingBottom: 30,
    alignItems: "center",
  },
  logo: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  tagline: {
    color: "white",
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "grey",
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "lightgrey",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#B8243A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  switchText: {
    color: "grey",
  },
  link: {
    color: "#B8243A",
    fontWeight: "bold",
  },
});
