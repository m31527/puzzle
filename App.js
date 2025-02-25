import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/Home';
import Evaluate from './src/Evaluate';
import Report from './src/Report';
import History from './src/History';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
