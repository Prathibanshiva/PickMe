import { View, Text } from "react-native";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: "#1FC600",
        }}
      >
        PickMe 🚖
      </Text>

      <Text
        style={{
          marginTop: 10,
          fontSize: 16,
          color: "#444",
        }}
      >
        Smarter Rides. Shared Better.
      </Text>
    </View>
  );
}