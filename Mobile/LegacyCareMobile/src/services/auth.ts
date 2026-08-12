import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "loggedInUser";
const TOKEN_KEY = "authToken";

export const saveUser = async (user: any) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.log("Save user error:", error);
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  } catch (error) {
    console.log("Get user error:", error);
    return null;
  }
};

export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.log("Remove user error:", error);
  }
};

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.log("Save token error:", error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.log("Get token error:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.log("Remove token error:", error);
  }
};