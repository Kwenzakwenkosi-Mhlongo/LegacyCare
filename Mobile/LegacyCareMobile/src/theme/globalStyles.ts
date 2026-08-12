import { StyleSheet } from "react-native";
import Colors from "./colors";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  
  goldText: {
    color: Colors.gold,
  },
  
  whiteText: {
    color: Colors.white,
  },
  
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.white,
  },
  
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default globalStyles;