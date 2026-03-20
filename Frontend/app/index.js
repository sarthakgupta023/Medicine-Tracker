import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Index() {

  useEffect(() => {

    const checkUser = async () => {
      try {
        // ✅ read real token from AsyncStorage instead of null
        const token  = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");

        // wait 2 seconds for splash screen
        setTimeout(() => {
          if (token && userId) {
            router.replace("/home");   // ✅ already logged in → go home
          } else {
            router.replace("/login");  // ✅ not logged in → go login
          }
        }, 2000);

      } catch (error) {
        console.log("Splash error:", error);
        router.replace("/login");
      }
    };

    checkUser();

  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/mylogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
    height: 200,
  },
});