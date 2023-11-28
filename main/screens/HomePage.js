import {

  SafeAreaView,
  Image,
  Pressable,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/core";
import AppStyles from "../constants/AppStyles";
import Icon from "../assets/profile_pic.png";
import DashboardPage from "./drawer/Dashboard";
// import ExpensesPage from "./drawer/Expenses";
// import IncomePage from "./drawer/Income";
// import TransactionPage from "./drawer/ViewTransac";
import { Modal, View, Text, TouchableHighlight, StyleSheet } from 'react-native';
import ForecastPage from "./drawer/Forecast";
import SettingsPage from "./drawer/Settings";
import "react-native-gesture-handler";
import {
  DrawerItemList,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { SimpleLineIcons, MaterialIcons } from "@expo/vector-icons";
import { auth, database } from "../src/firebase";
import { ref, get } from "firebase/database";
import { launchImageLibrary } from 'react-native-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../src/firebase'; // Assuming storage is exported from firebase.js
import { update } from 'firebase/database';

const Drawer = createDrawerNavigator();

const HomePage = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [blobFile, setBlobFile] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, "users/" + user.uid);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserData(userData);
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  const changeProfilePic = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
      });
  
      console.log("Document Picker Result: ", result); // Detailed logging of the result
  
      if (result.type !== 'cancel' && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log("Selected image URI: ", selectedFile.uri);
        uploadImage(selectedFile.uri);
      } else {
        console.error("Document picker was cancelled or no file was selected");
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };
  
  const uploadImage = async (uri) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated.");
      return;
    }

    if (!uri) {
      console.error("Invalid URI.");
      return;
    }

    const fileRef = storageRef(storage, `profile_pics/${user.uid}`);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(fileRef, blob);

      const imageUrl = await getDownloadURL(fileRef);
      const userRef = ref(database, 'users/' + user.uid);
      await update(userRef, { profilePic: imageUrl });
      console.log('Profile picture updated successfully!');
      setUserData({ ...userData, profilePic: imageUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };



  const MyModal = () => {
    const [modalVisible, setModalVisible] = useState(false);
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => {
        return (
          <SafeAreaView>
          <View style={styles.drawerItems}>
          <TouchableHighlight style={styles.profilePic} onPress={changeProfilePic}>
  <Image
    source={
      userData && userData.profilePic
        ? { uri: userData.profilePic }  // Remote URI
        : Icon // Local image
    }
    style={styles.profilePic}
  />
</TouchableHighlight>
              {userData ? (
                <>
                  <Text style={styles.username}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                  <Text style={styles.company}>{userData.companyName}</Text>
                </>
              ) : null}
            </View>
            <DrawerItemList {...props} />
            <View style={styles.logoutContainer}>
              <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" color="#c93756" size={22} />
                <Text style={{ fontSize: 16, fontWeight: "bold", marginLeft: 25, color: "#c93756" }}>Logout</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        );
      }}
      screenOptions={{
        drawerStyle: {
          backgroundColor: "white",
          width: 250,
        },
        headerStyle: {
          backgroundColor: AppStyles.color.accent,
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        drawerLabelStyle: {
          color: "black",
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: "Dashboard",
          title: "Dashboard",
          drawerIcon: () => (
            <SimpleLineIcons name="home" size={20} color="#808080" />
          ),
        }}
        component={DashboardPage}
      />
      {/* <Drawer.Screen
        name="View Transaction"
        options={{
          drawerLabel: "View Transaction",
          title: "View Transaction",
          drawerIcon: () => (
            <MaterialIcons name="poll" size={20} color="#808080" />
          ),
        }}
        component={TransactionPage}
      />
      <Drawer.Screen
        name="Expenses"
        options={{
          drawerLabel: "Expenses",
          title: "Expenses",
          drawerIcon: () => (
            <MaterialIcons name="payments" size={20} color="#808080" />
          ),
        }}
        component={ExpensesPage}
      />
      <Drawer.Screen
        name="Income"
        options={{
          drawerLabel: "Income",
          title: "Income",
          drawerIcon: () => (
            <MaterialIcons name="attach-money" size={20} color="#808080" />
          ),
        }}
        component={IncomePage}
      /> */}
      <Drawer.Screen
        name="Forecast"
        options={{
          drawerLabel: "Future Sight",
          title: "Forecast",
          drawerIcon: () => (
            <MaterialIcons
              name="stacked-line-chart"
              size={20}
              color="#808080"
            />
          ),
        }}
        component={ForecastPage}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerIcon: () => (
            <SimpleLineIcons name="settings" size={20} color="#808080" />
          ),
        }}
        component={SettingsPage}
      />
    </Drawer.Navigator>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppStyles.color.background,
  },
  drawerItems: {
    height: "50%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppStyles.color.accent,
  },
  profilePic: {
    height: 130,
    width: 130,
    borderRadius: 65,
    marginBottom: 10,
  },
  username: {
    fontSize: 22,
    marginVertical: 3,
    fontWeight: "bold",
    color: "#fff",
  },
  company: {
    fontSize: 16,
    color: "#fff",
  },
  logoutContainer: {
    marginLeft: 20,
    marginTop: 40,
    //flexDirection: "row",
  },
  logoutButton: {
    flexDirection: "row",
  },
});