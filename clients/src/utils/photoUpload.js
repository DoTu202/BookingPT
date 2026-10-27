import {launchImageLibrary} from 'react-native-image-picker';
import profileApi from '../apis/profileApi';

// Opens the photo library and uploads the chosen image as the profile photo.
// Resolves to the new photo URL (cache-busted), or null when the user
// cancels; throws with a Vietnamese message on failure.
export const pickAndUploadProfilePhoto = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1080,
    maxHeight: 1080,
  });
  if (result.didCancel) {
    return null;
  }
  const asset = result.assets?.[0];
  if (result.errorCode || !asset) {
    throw new Error('Không chọn được ảnh. Vui lòng thử lại.');
  }

  const formData = new FormData();
  formData.append('photo', {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `photo_${Date.now()}.jpg`,
  });
  const response = await profileApi.uploadPhoto(formData);
  return `${response.data.data.photoUrl}?t=${Date.now()}`;
};
