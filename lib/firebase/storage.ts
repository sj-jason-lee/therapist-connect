import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage } from "./config";

export async function uploadCredentialDocument(
  userId: string,
  documentType: string,
  file: File
): Promise<string> {
  const storage = getStorage();

  // Create a unique filename with timestamp
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const fileName = `${documentType}_${timestamp}.${extension}`;

  // Create reference to the file location
  const storageRef = ref(storage, `credentials/${userId}/${fileName}`);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
}

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  const storage = getStorage();

  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const fileName = `profile_${timestamp}.${extension}`;

  const storageRef = ref(storage, `profiles/${userId}/${fileName}`);

  await uploadBytes(storageRef, file);

  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
}
