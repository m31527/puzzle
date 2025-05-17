import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStateProvider } from './src/context/AppStateContext';
import Home from './src/Home';
import Evaluate from './src/Evaluate';
import Report from './src/Report';
import History from './src/History';
import PuzzleTest from './src/PuzzleTest';
import PDFView from './src/PDFView';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <AppStateProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Evaluate" 
          component={Evaluate}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Report" 
          component={Report}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="History" 
          component={History}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PDFView" 
          component={PDFView}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PuzzleTest" 
          component={PuzzleTest}
          options={{ headerShown: false }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </AppStateProvider>
  );
};

export default App;
