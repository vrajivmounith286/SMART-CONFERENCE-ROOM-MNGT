// ===== AUTHENTICATION MODULE — Firebase =====
import { auth, db, googleProvider } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
} from 'firebase/firestore';

let _currentUser = null;   // { id, name, email, role, department, initials, office, ... }
let _authUser = null;       // Firebase auth.currentUser object

// ===== INITIALIZE — check for existing session =====
export async function initAuth() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // Only need to check once during init
            if (user) {
                _authUser = user;
                _currentUser = await _fetchProfile(user.uid);
            }
            resolve(_currentUser);
        });
    });
}

// ===== REGISTER with email + password =====
export async function registerWithEmail(email, password, profile) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create profile in Firestore
        const profileData = {
            id: user.uid,
            name: profile.name,
            email: email.toLowerCase(),
            mobile: profile.mobile || '',
            role: profile.role || 'employee',
            department: profile.department || 'IT',
            office: profile.office || 'off1',
            initials: _makeInitials(profile.name),
        };

        await setDoc(doc(db, 'profiles', user.uid), profileData);

        _authUser = user;
        _currentUser = profileData;
        return { user: _currentUser };
    } catch (error) {
        return { error: _friendlyError(error.code) };
    }
}

// ===== LOGIN with email + password =====
export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        _authUser = user;
        _currentUser = await _fetchProfile(user.uid);
        if (!_currentUser) return { error: 'Profile not found. Please register first.' };
        return { user: _currentUser };
    } catch (error) {
        return { error: _friendlyError(error.code) };
    }
}

// ===== LOGIN with Google =====
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        _authUser = user;
        _currentUser = await _fetchProfile(user.uid);

        if (!_currentUser) {
            // New Google user — profile will be created via role picker modal
            return { success: true, isNewUser: true, authUser: user };
        }

        return { success: true, user: _currentUser };
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            return { error: 'Sign-in popup was closed. Please try again.' };
        }
        return { error: _friendlyError(error.code) };
    }
}

// ===== Create profile for Google user (after OAuth) =====
export async function createGoogleProfile(user, role) {
    try {
        const profileData = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            mobile: '',
            role: role,
            department: 'IT',
            office: 'off1',
            initials: _makeInitials(user.displayName || user.email.split('@')[0]),
        };

        await setDoc(doc(db, 'profiles', user.uid), profileData, { merge: true });

        _currentUser = profileData;
        return { user: _currentUser };
    } catch (error) {
        return { error: error.message };
    }
}

// ===== LOGOUT =====
export async function logout() {
    await signOut(auth);
    _currentUser = null;
    _authUser = null;
}

// ===== AUTH STATE CHANGE LISTENER =====
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            _authUser = user;
            _currentUser = await _fetchProfile(user.uid);
            callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', _currentUser, user);
        } else {
            _authUser = null;
            _currentUser = null;
            callback('SIGNED_OUT', null, null);
        }
    });
}

// ===== GETTERS =====
export function getCurrentUser() { return _currentUser; }
export function getAuthUser() { return _authUser; }

export function isAdmin() {
    return _currentUser?.role === 'admin';
}

export function isManager() {
    return _currentUser?.role === 'manager' || _currentUser?.role === 'admin';
}

export function hasPermission(permission) {
    if (!_currentUser) return false;
    const permissions = {
        admin: ['manage_rooms', 'manage_users', 'manage_settings', 'view_analytics', 'book_rooms', 'manage_bookings', 'view_signage', 'checkin'],
        manager: ['view_analytics', 'book_rooms', 'manage_bookings', 'view_signage', 'checkin'],
        employee: ['book_rooms', 'view_signage', 'checkin'],
    };
    return (permissions[_currentUser.role] || []).includes(permission);
}

// ===== FETCH all profiles (for attendee lists, admin panel, etc.) =====
export async function fetchAllProfiles() {
    try {
        const querySnapshot = await getDocs(collection(db, 'profiles'));
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
}

// ===== PRIVATE HELPERS =====
async function _fetchProfile(userId) {
    try {
        const docSnap = await getDoc(doc(db, 'profiles', userId));
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

function _makeInitials(name) {
    const parts = (name || '').trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name || 'U').substring(0, 2).toUpperCase();
}

// Translate Firebase error codes to user-friendly messages
function _friendlyError(code) {
    const map = {
        'auth/email-already-in-use': 'This email is already registered. Please sign in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'Account not found. Please register first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/invalid-credential': 'Invalid credentials. Please check and try again.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
    };
    return map[code] || `Authentication error: ${code}`;
}
