import React, { useEffect, useState } from "react";
import {
  AsyncStorage,
  Button,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Animated,
  Platform,
  StatusBar,
  TextInput,
  Picker,
} from "react-native";
import * as AppAuth from "expo-app-auth";
import { material, robotoWeights } from "react-native-typography";
import ApiData from "./constants/ApiData";
import { ScrollView } from "react-native-gesture-handler";
import AuthId from "./constants/AuthId";
const BytelionLogo = require("./assets/bytelion.png");

export default function App() {
  let [authState, setAuthState] = useState(null);

  useEffect(() => {
    (async () => {
      let cachedAuth = await getCachedAuthAsync();
      if (cachedAuth && !authState) {
        setAuthState(cachedAuth);
      }
    })();
  }, []);

  return (
    <View>
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        ]}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <Animated.Image
            source={BytelionLogo}
            style={[styles.logo, { opacity: 1 }]}
          />
          <Animated.Text
            style={[
              material.headline,
              styles.text,
              robotoWeights.condensedBold,
              { opacity: 1 },
            ]}
          >
            Welcome.
          </Animated.Text>
        </KeyboardAvoidingView>
      </View>
      {authState ? (
        <View>
          <Button
            title="Sign Out "
            onPress={async () => {
              await signOutAsync(authState);
              setAuthState(null);
            }}
          />
          <View>
            <ReviewScreen />
          </View>
        </View>
      ) : (
        <Button
          title="Sign In with Google "
          onPress={async () => {
            const _authState = await signInAsync();
            setAuthState(_authState);
          }}
        />
      )}
      <Text
        style={[
          material.headline,
          { textAlign: "center", fontSize: 15 },
          robotoWeights.condensedBold,
        ]}
      >
        Viewing Reviews made easier.
      </Text>
    </View>
  );
}

//Style ================================================================================================================================================
const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { textAlign: "center" },
  logo: {
    resizeMode: "contain",
    marginBottom: 10,
    padding: 10,
    marginTop: 10,
    backgroundColor: "white",
  },
});
//================================================================//================================================================
export function ReviewScreen() {
  const [messagesArray, setMessagesArray] = useState(ApiData);
  const [filteredArray, setFilterArray] = useState([]);
  const [reply, setReply] = useState("");
  const [filterType, setFilterType] = useState(0);

  return (
    <View>
      <Picker
        onValueChange={(value) => {
          if (value === 0) {
            setFilterArray([]);
          } else if (value === 1) {
            var newArray = messagesArray.sort((a, b) => {
              return new Date(b.created_at) - new Date(a.created_at);
            });
            setFilterArray(newArray);
          } else if (value === 2) {
            var newArray = messagesArray.sort((a, b) => {
              return new Date(a.created_at) - new Date(b.created_at);
            });
            setFilterArray(newArray);
          }

          setFilterType(value);
        }}
        selectedValue={filterType}
      >
        <Picker.Item label="Ascending" value={2}></Picker.Item>
        <Picker.Item label="Descending" value={1}></Picker.Item>
        <Picker.Item label="No Filter" value={0}></Picker.Item>
      </Picker>
      <KeyboardAvoidingView>
        <ScrollView>
          {(filteredArray.length > 0 ? filteredArray : messagesArray).map(
            (message, id) => {
              return (
                <View
                  key={id}
                  styles={{
                    backgroundColor: "pink",
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>Date</Text>
                  <Text>
                    {new Date(message.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontWeight: "bold" }}>Rating</Text>
                  <Text>{message.rating}</Text>
                  <Text style={{ fontWeight: "bold" }}>Message</Text>
                  <Text>{message.message}</Text>
                  <Text style={{ fontWeight: "bold" }}>Rating</Text>
                  <Text>{message.rating}</Text>
                  <Text style={{ fontWeight: "bold" }}>Your Reply</Text>
                  <Text>{message.reply || "None"}</Text>

                  <TextInput
                    onChangeText={(e) => setReply(e)}
                    placeholder="Enter Reply..."
                    value={reply}
                  />

                  <Button
                    title="reply"
                    onPress={() => {
                      var newArray = messagesArray.slice();
                      newArray[id].reply = reply;
                      setMessagesArray(newArray);
                      setReply("");
                    }}
                  />
                  <Button
                    title="👍"
                    onPress={() => {
                      // should optimize to avoid copying whole array
                      var newArray = messagesArray.slice();
                      newArray[id].rating += 1;
                      setMessagesArray(newArray);
                    }}
                  />
                  <Button
                    title="👎"
                    onPress={() => {
                      // should optimize to avoid copying whole array
                      var newArray = messagesArray.slice();
                      newArray[id].rating -= 1;
                      setMessagesArray(newArray);
                    }}
                  />
                </View>
              );
            }
          )}
          <View style={{ paddingBottom: 400 }}></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
// HELPER FUNCTIONS================================================================================================================================================
let config = {
  issuer: "https://accounts.google.com",
  scopes: ["openid", "profile"],
  clientId: AuthId.ANDROID_CLIENT_ID,
  scopes: ["profile", "email"],
};

let StorageKey = "@MyApp:CustomGoogleOAuthKey";

export async function signInAsync() {
  let authState = await AppAuth.authAsync(config);
  await cacheAuthAsync(authState);
  return authState;
}

async function cacheAuthAsync(authState) {
  return await AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
}

export async function getCachedAuthAsync() {
  let value = await AsyncStorage.getItem(StorageKey);
  let authState = JSON.parse(value);
  if (authState) {
    if (checkIfTokenExpired(authState)) {
      return refreshAuthAsync(authState);
    } else {
      return authState;
    }
  }
  return null;
}

function checkIfTokenExpired({ accessTokenExpirationDate }) {
  return new Date(accessTokenExpirationDate) < new Date();
}

async function refreshAuthAsync({ refreshToken }) {
  let authState = await AppAuth.refreshAsync(config, refreshToken);

  await cacheAuthAsync(authState);
  return authState;
}

export async function signOutAsync({ accessToken }) {
  try {
    await AppAuth.revokeAsync(config, {
      token: accessToken,
      isClientIdProvided: true,
    });
    await AsyncStorage.removeItem(StorageKey);
    return null;
  } catch (e) {
    alert(`Failed to revoke token: ${e.message}`);
  }
}
//================================================================================================================================================
