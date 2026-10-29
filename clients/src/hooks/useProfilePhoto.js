import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {authSelector} from '../redux/reducers/authReducer';
import {pickAndUploadProfilePhoto} from '../utils/photoUpload';
import {updateSession} from '../utils/session';

// Pick + upload a new profile photo and keep the session in sync.
// `onUploaded(photoUrl)` lets the screen update its own copy of the profile.
const useProfilePhoto = onUploaded => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [uploading, setUploading] = useState(false);

  const changePhoto = useCallback(async () => {
    setUploading(true);
    try {
      const photoUrl = await pickAndUploadProfilePhoto();
      if (photoUrl) {
        onUploaded?.(photoUrl);
        await updateSession(dispatch, auth, {photoUrl});
      }
    } catch (err) {
      Alert.alert('Không đổi được ảnh', err.message);
    } finally {
      setUploading(false);
    }
  }, [auth, dispatch, onUploaded]);

  return {uploading, changePhoto};
};

export default useProfilePhoto;
