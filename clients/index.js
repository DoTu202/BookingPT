/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {registerBackgroundPushHandler} from './src/utils/pushNotifications';

registerBackgroundPushHandler();

AppRegistry.registerComponent(appName, () => App);
