import { router } from "expo-router";
import { useEffect } from "react";
import { Image, View } from "react-native";
export default function Index() {

  useEffect(() => {

    const checkUser = async () => {
      try {
        const token = null;

        setTimeout(() => {
          if (token) {
            router.replace("/home");
          } else {
            router.replace("/login");
          }
        }, 2000);

      } catch (error) {
        console.log(error);
        router.replace("/login");
      }
    };

    checkUser();

  }, []);

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    }}>
      <Image source={require("../assets/images/mylogo.png")} />
    </View>
  );
}