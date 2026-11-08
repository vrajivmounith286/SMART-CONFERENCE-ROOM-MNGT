// ===== FIREBASE CLOUD AUTH BRIDGE =====
// Handles Google Sign-in AND Email/Password registration & login in Firebase Cloud!
// Every account is stored in Firebase Cloud so users can log in from ANY device.

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyA39BEGbUvcKZiN8NEECDUUtcrHrCII4fg",
    authDomain: "smart-conference-room-mn-11785.firebaseapp.com",
    projectId: "smart-conference-room-mn-11785",
    storageBucket: "smart-conference-room-mn-11785.firebasestorage.app",
    messagingSenderId: "943043774496",
    appId: "1:943043774496:web:058b03b8881b61af3f1445",
    measurementId: "G-D5LMFVFLRQ",
};

// Guard: prevent double-init
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

function makeInitials(name) {
    const parts = (name || '').trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name || 'U').substring(0, 2).toUpperCase();
}

/**
 * 1. CLOUD REGISTRATION: Creates user in Firebase Auth & saves profile to Firestore
 */
window.handleEmailRegister = async function (info, btnElement) {
    const originalHtml = btnElement ? btnElement.innerHTML : null;
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Cloud Account...';
    }

    try {
        console.log('[Firebase Auth] Creating account in cloud for:', info.email);
        const userCredential = await createUserWithEmailAndPassword(auth, info.email, info.password);
        const user = userCredential.user;

        const profile = {
            id: user.uid,
            name: info.name.trim(),
            email: info.email.trim().toLowerCase(),
            mobile: info.mobile ? info.mobile.trim() : '',
            role: info.role || 'employee',
            department: info.department || 'IT',
            office: info.office || 'off1',
            initials: makeInitials(info.name),
            createdAt: new Date().toISOString()
        };

        // Save profile in Firestore Cloud
        try {
            await setDoc(doc(db, 'profiles', user.uid), profile);
            console.log('[Firebase Auth] Profile stored in Firestore:', user.uid);
        } catch (dbErr) {
            console.warn('[Firebase Auth] Firestore save warning:', dbErr);
        }

        // Cache in local store
        if (typeof registerUser === 'function') {
            registerUser({ ...profile, password: info.password });
        }
        doLogin(profile);
        showApp();
        showToast(`Welcome, ${profile.name}! Account created in Cloud.`, 'success');
        return { success: true, user: profile };
    } catch (error) {
        console.error('[Firebase Register Error]:', error);
        let msg = error.message;

        if (error.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered! Please click "Sign In" to log in.';
        } else if (error.code === 'auth/weak-password') {
            msg = 'Password should be at least 6 characters long.';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
        } else if (error.code === 'auth/operation-not-allowed') {
            msg = 'Email/Password sign-in is not enabled in Firebase Console! Go to Firebase -> Authentication -> Sign-in method -> Enable Email/Password.';
            alert(msg);
        }

        showToast(msg, 'error', 6000);
        return { error: msg };
    } finally {
        if (btnElement && originalHtml) {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHtml;
        }
    }
};

/**
 * 2. CLOUD LOGIN: Verifies email/password with Firebase Auth & fetches Firestore profile
 */
window.handleEmailLogin = async function (email, password, btnElement) {
    const originalHtml = btnElement ? btnElement.innerHTML : null;
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    }

    try {
        console.log('[Firebase Auth] Cloud login for:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch cloud profile from Firestore
        let profile = null;
        try {
            const snap = await getDoc(doc(db, 'profiles', user.uid));
            if (snap.exists()) {
                profile = snap.data();
            }
        } catch (dbErr) {
            console.warn('[Firebase Auth] Firestore getDoc warning:', dbErr);
        }

        // Fallback if profile doc not created yet
        if (!profile) {
            const local = typeof findUserByEmailOrMobile === 'function' ? findUserByEmailOrMobile(email) : null;
            profile = local || {
                id: user.uid,
                name: user.displayName || email.split('@')[0],
                email: email.toLowerCase(),
                mobile: '',
                role: 'employee',
                department: 'IT',
                office: 'off1',
                initials: makeInitials(user.displayName || email.split('@')[0])
            };
            try {
                await setDoc(doc(db, 'profiles', user.uid), profile, { merge: true });
            } catch (_) {}
        }

        doLogin(profile);
        showApp();
        showToast(`Welcome back, ${profile.name}!`, 'success');
        return { success: true, user: profile };
    } catch (error) {
        console.error('[Firebase Login Error]:', error);
        let msg = error.message;

        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            // Check local store for backwards compatibility
            const local = typeof findUserByEmailOrMobile === 'function' ? findUserByEmailOrMobile(email) : null;
            if (local && local.password === password) {
                console.log('[Firebase Auth] Found matching local account, logging in and migrating to cloud...');
                doLogin(local);
                showApp();
                showToast(`Welcome back, ${local.name}!`, 'success');

                // Migrate this legacy user to Firebase Cloud in background
                createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
                    await setDoc(doc(db, 'profiles', cred.user.uid), { ...local, id: cred.user.uid });
                    console.log('[Firebase Auth] Legacy user successfully migrated to cloud!');
                }).catch(() => {});
                return { success: true, user: local };
            }
            msg = 'Invalid email or password! If you are new, click Register to create an account.';
        } else if (error.code === 'auth/wrong-password') {
            msg = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
            msg = 'Too many failed login attempts. Please wait a minute and try again.';
        } else if (error.code === 'auth/operation-not-allowed') {
            msg = 'Email/Password sign-in is not enabled in Firebase Console! Go to Firebase -> Authentication -> Sign-in method -> Enable Email/Password.';
            alert(msg);
        }

        showToast(msg, 'error', 6000);
        return { error: msg };
    } finally {
        if (btnElement && originalHtml) {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHtml;
        }
    }
};

/**
 * 3. GOOGLE CLOUD SIGN-IN: Popup login, saves cloud profile for any user
 */
window.handleGoogleSignIn = async function (btnElement) {
    const originalHtml = btnElement ? btnElement.innerHTML : null;
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to Google...';
    }

    try {
        console.log('[Google Auth] Launching Google popup...');
        const result = await signInWithPopup(auth, provider);
        const gUser = result.user;
        const email = (gUser.email || '').toLowerCase();
        console.log('[Google Auth] Authenticated as:', email);

        // Fetch cloud profile from Firestore
        let profile = null;
        try {
            const snap = await getDoc(doc(db, 'profiles', gUser.uid));
            if (snap.exists()) {
                profile = snap.data();
            }
        } catch (dbErr) {
            console.warn('[Google Auth] Firestore getDoc warning:', dbErr);
        }

        if (!profile) {
            // New Google user — create in cloud Firestore
            const name = gUser.displayName || email.split('@')[0];
            profile = {
                id: gUser.uid,
                name: name,
                email: email,
                mobile: '',
                role: 'employee',
                department: 'IT',
                office: 'off1',
                initials: makeInitials(name),
                createdAt: new Date().toISOString()
            };
            try {
                await setDoc(doc(db, 'profiles', gUser.uid), profile);
                console.log('[Google Auth] Created new cloud profile:', gUser.uid);
            } catch (_) {}
        }

        if (typeof registerUser === 'function') {
            registerUser({ ...profile, password: '' });
        }

        doLogin(profile);
        showApp();
        showToast(`Welcome, ${profile.name}! Signed in with Google.`, 'success');
        return { success: true, user: profile };
    } catch (error) {
        console.error('[Google Auth Error]:', error);

        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            return;
        }

        if (error.code === 'auth/popup-blocked') {
            const msg = 'Popup was blocked by your browser! Please allow popups for this site in your browser address bar.';
            alert(msg);
            showToast(msg, 'warning', 6000);
            return;
        }

        if (error.code === 'auth/operation-not-allowed') {
            const msg = 'Google Sign-in is NOT enabled in your Firebase Console! Please go to Firebase Console -> Authentication -> Sign-in method -> Click Google -> Enable -> Save.';
            alert(msg);
            showToast('Google Sign-in disabled in Firebase', 'error', 8000);
            return;
        }

        if (error.code === 'auth/unauthorized-domain') {
            const msg = 'This domain is not authorized in Firebase! Please add your current URL to Firebase Console -> Authentication -> Settings -> Authorized Domains.';
            alert(msg);
            showToast('Domain not authorized in Firebase', 'error', 8000);
            return;
        }

        showToast(error.message || error.code || 'Failed to sign in with Google', 'error', 6000);
    } finally {
        if (btnElement && originalHtml) {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHtml;
        }
    }
};

/**
 * 4. LOGOUT: Signs out of Firebase Auth and clears session
 */
window.handleLogout = async function () {
    try {
        await signOut(auth);
    } catch (_) {}
    doLogout();
    if (typeof sigInt !== 'undefined' && sigInt) clearInterval(sigInt);
    showLogin();
    window.location.hash = '';
    showToast('Logged out successfully', 'info');
};
