/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/Home';
import Evaluate from './src/Evaluate';
import History from './src/History';
import Report from './src/Report';
import PreviewReport from './src/PreviewReport';
import { AppStateProvider } from './src/context/AppStateContext';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Evaluate" component={Evaluate} />
          <Stack.Screen name="History" component={History} />
          <Stack.Screen name="Report" component={Report} />
          <Stack.Screen name="PreviewReport" component={PreviewReport} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppStateProvider>
  );
}

export default App;
