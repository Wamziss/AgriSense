import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import AgriSenseApp from './App';

const Stack = createStackNavigator();

export default function App() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={AgriSenseApp} />
      {/* <StatusBar barStyle={"default"} /> */}
    </Stack.Navigator>
  );
}
