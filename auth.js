import { supabase } from './supabase.js';

const MAX_LOGIN_ATTEMPTS = 3;
let loginAttempts = 0;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleLogin(e) {
    e.preventDefault();

    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        showError('Maximum login attempts reached. Please try again later.');
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            loginAttempts++;
            const attemptsLeft = MAX_LOGIN_ATTEMPTS - loginAttempts;

            if (attemptsLeft > 0) {
                showError(`Invalid email or password. ${attemptsLeft} attempt(s) remaining.`);
                showAttempts(`${attemptsLeft} login attempt(s) remaining`);
            } else {
                showError('Maximum login attempts reached. Please try again later.');
                document.getElementById('loginForm').querySelector('button[type="submit"]').disabled = true;
            }
            return;
        }

        window.location.href = 'index.html';
    } catch (error) {
        showError('An error occurred during login. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            showError(authError.message);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    phone: phone || null,
                    address: address || null
                }
            ]);

        if (profileError) {
            showError('Registration failed. Please try again.');
            return;
        }

        showSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        showError('An error occurred during registration. Please try again.');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.classList.remove('show');
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');

    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.remove('show');
}

function showAttempts(message) {
    const attemptsDiv = document.getElementById('attemptsLeft');
    if (attemptsDiv) {
        attemptsDiv.textContent = message;
        attemptsDiv.classList.add('show');
    }
}
