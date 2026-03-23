import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../private";

export default function Signup() {

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  // ✅ validation before hitting API
  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await axios.post(`${api}/user/signup`, {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password: password.trim(),
      });

      // ✅ fixed — backend returns string "true"/"false" in body
      // response.data is the actual body
      if (response.data === "true" || response.status === 200) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "Login Now", onPress: () => router.replace("/login") },
        ]);
      } else {
        Alert.alert("Error", "User already exists");
      }

    } catch (error) {
      console.log("Signup error:", error);

      // ✅ fixed error handling
      const msg = error.response?.data?.message
               || error.response?.data
               || "Signup failed. Please try again.";
      Alert.alert("Error", msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Create Account</Text>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        placeholder="Enter your name"
        style={styles.input}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Enter your email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="Min 6 characters"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />

      {/* Signup Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Create Account</Text>
        }
      </TouchableOpacity>

      {/* Login Redirect */}
      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.link}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#1a1a2e",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 15,
    color: "#1a1a2e",
  },

  button: {
    backgroundColor: "#2E86DE",
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
  },

  buttonDisabled: {
    backgroundColor: "#a0c4f1",
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#2E86DE",
    fontWeight: "500",
  },

});