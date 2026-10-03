import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  writeBatch,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  ConstellationState, 
  StarEntry, 
  UnlitTask, 
  MeteorSub, 
  ArchivedNight,
  UnderstoryThread
} from '../types/constellation';

// Initialize Firebase App with user project credentials
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics if supported in browser environment
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics is optional or blocked by client extensions
  });
}

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with robust local caching where supported
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db: Firestore = dbInstance;

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function loginAnonymously(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ---------------- FIRESTORE SYNC & PERSISTENCE ----------------

/**
 * Load complete constellation state from user's Firestore document & subcollections
 * Gracefully handles offline or network-restricted environments by falling back to null (using local data)
 */
export async function loadUserConstellationState(user: User): Promise<ConstellationState | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  try {
    // Timeout safeguard for offline or slow connections (max 4 seconds)
    const fetchWithTimeout = new Promise<ConstellationState | null>(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 4000);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          clearTimeout(timeoutId);
          resolve(null);
          return;
        }

        const userData = userSnap.data();

        // Fetch entries
        const entriesSnap = await getDocs(collection(db, 'users', user.uid, 'entries'));
        const entries: StarEntry[] = [];
        entriesSnap.forEach((d) => entries.push(d.data() as StarEntry));

        // Fetch tasks
        const tasksSnap = await getDocs(collection(db, 'users', user.uid, 'tasks'));
        const tasks: UnlitTask[] = [];
        tasksSnap.forEach((d) => tasks.push(d.data() as UnlitTask));

        // Fetch subscriptions
        const subsSnap = await getDocs(collection(db, 'users', user.uid, 'subs'));
        const subs: MeteorSub[] = [];
        subsSnap.forEach((d) => subs.push(d.data() as MeteorSub));

        // Fetch archive
        const archiveSnap = await getDocs(collection(db, 'users', user.uid, 'archive'));
        const archive: ArchivedNight[] = [];
        archiveSnap.forEach((d) => archive.push(d.data() as ArchivedNight));

        // Fetch understory
        const understorySnap = await getDocs(collection(db, 'users', user.uid, 'understory'));
        const usOwn: { id: string; text: string; ts: number }[] = [];
        understorySnap.forEach((d) => usOwn.push(d.data() as { id: string; text: string; ts: number }));

        // Fetch understory threads
        const threadsSnap = await getDocs(collection(db, 'users', user.uid, 'understory_threads'));
        const usThreads: UnderstoryThread[] = [];
        threadsSnap.forEach((d) => usThreads.push(d.data() as UnderstoryThread));

        clearTimeout(timeoutId);
        resolve({
          birthYear: userData.birthYear ?? 1996,
          lifeExp: userData.lifeExp ?? 80,
          wage: userData.wage ?? 25,
          entries,
          tasks,
          subs,
          archive,
          usOwn,
          usThreads,
          usGhosts: null,
          lastDate: userData.lastDate ?? new Date().toISOString().slice(0, 10),
        });
      } catch (innerErr) {
        clearTimeout(timeoutId);
        reject(innerErr);
      }
    });

    return await fetchWithTimeout;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (
      errorMsg.includes('offline') ||
      errorMsg.includes('unavailable') ||
      errorMsg.includes('network') ||
      errorMsg.includes('deadline-exceeded')
    ) {
      // Offline fallback: state continues in local storage safely
      return null;
    }
    console.warn('Constellation cloud load notice:', errorMsg);
    return null;
  }
}

/**
 * Save complete constellation state to user's Firestore document & subcollections
 */
export async function saveUserConstellationState(user: User, state: ConstellationState): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    
    // Set user profile doc
    await setDoc(
      userDocRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Stargazer',
        photoURL: user.photoURL || '',
        birthYear: state.birthYear,
        lifeExp: state.lifeExp,
        wage: state.wage,
        lastDate: state.lastDate,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Save subcollections in a batch
    const batch = writeBatch(db);

    // Entries
    state.entries.forEach((entry) => {
      const entryRef = doc(db, 'users', user.uid, 'entries', entry.id);
      batch.set(entryRef, entry, { merge: true });
    });

    // Tasks
    state.tasks.forEach((task) => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      batch.set(taskRef, task, { merge: true });
    });

    // Subs
    state.subs.forEach((sub) => {
      const subRef = doc(db, 'users', user.uid, 'subs', sub.id);
      batch.set(subRef, sub, { merge: true });
    });

    // Archive
    state.archive.forEach((arc) => {
      const arcRef = doc(db, 'users', user.uid, 'archive', arc.date);
      batch.set(arcRef, arc, { merge: true });
    });

    // Understory
    state.usOwn.forEach((thought) => {
      const thoughtRef = doc(db, 'users', user.uid, 'understory', thought.id);
      batch.set(thoughtRef, thought, { merge: true });
    });

    // Understory Threads
    state.usThreads.forEach((thread) => {
      const threadRef = doc(db, 'users', user.uid, 'understory_threads', `thread_${thread.from}_${thread.to}`);
      batch.set(threadRef, thread, { merge: true });
    });

    await batch.commit();
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (!errorMsg.includes('offline') && !errorMsg.includes('unavailable')) {
      console.warn('Constellation cloud save notice:', errorMsg);
    }
  }
}

/**
 * Remove an item from subcollection in Firestore
 */
export async function deleteFirestoreDocument(
  user: User, 
  subcollection: 'entries' | 'tasks' | 'subs' | 'archive' | 'understory' | 'understory_threads', 
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', user.uid, subcollection, docId);
    await deleteDoc(docRef);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (!errorMsg.includes('offline') && !errorMsg.includes('unavailable')) {
      console.warn(`Could not delete doc ${docId} from ${subcollection}:`, errorMsg);
    }
  }
}
