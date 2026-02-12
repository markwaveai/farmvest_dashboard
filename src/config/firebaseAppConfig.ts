import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { compressImage } from '../utils/imageUtils';

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
const db = getFirestore(app);

/**
 * Uploads a file to Firebase Storage in the specified folder.
 * @param file The file to upload
 * @returns Promise resolving to the download URL
 */
export async function uploadToFirebase(file: File): Promise<string> {
    try {
        let fileToUpload = file;

        // Attempt compression for images
        if (file.type.startsWith('image/')) {
            try {
                fileToUpload = await compressImage(file, 0.7, 1280); // 1280px max width
            } catch (e) {
            }
        }

        const timestamp = Date.now();
        const now = new Date();
        const dateFolder = now.toISOString().split('T')[0];
        // Sanitize filename
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const uniqueName = `image_${timestamp}_${cleanName}`; // Prefix with image_ to match Flutter pattern slightly better
        const storagePath = `farmvest/buffaloesonboarding/${dateFolder}/${uniqueName}`;

        const storageRef = ref(storage, storagePath);

        // Upload bytes
        const snapshot = await uploadBytes(storageRef, fileToUpload);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        throw error;
    }
}

export { storage, db };
