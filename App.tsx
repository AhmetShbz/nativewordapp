import React from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import WordCard from './src/components/WordCard';

function App(): JSX.Element {
  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar barStyle="dark-content" />
      <WordCard />
    </SafeAreaView>
  );
}

export default App;