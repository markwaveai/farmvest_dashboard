import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC0XUQqk51NGLazlnaGKsPAgjkNNbgZR-E",
    authDomain: "markwave-481315.firebaseapp.com",
    projectId: "markwave-481315",
    storageBucket: "markwave-481315.firebasestorage.app",
    messagingSenderId: "612299373064",
    appId: "1:612299373064:web:f3a45cb23c3990060eefbd",
    measurementId: "G-R0G3KPKH1M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage in the specified folder.
 * @param file The file to upload
 * @param fileName Optional custom filename, defaults to timestamp + original name
 * @returns Promise resolving to the download URL
 */
export const uploadToFirebase = async (file: File): Promise<string> => {
    try {
        const timestamp = Date.now();
        const uniqueName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `farmvest/buffaloesonboarding/${uniqueName}`;

        const storageRef = ref(storage, storagePath);

        // Upload bytes
        const snapshot = await uploadBytes(storageRef, file);
        console.log('Uploaded a blob or file!', snapshot);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading to Firebase:", error);
        throw error;
    }
};

export { storage };
