import { supabase } from './supabase.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
    loadPageContent();
});

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profile) {
        currentUser.profile = profile;
    }
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', handleDonation);

        const donationType = document.getElementById('donationType');
        donationType.addEventListener('change', (e) => {
            const amountGroup = document.getElementById('amountGroup');
            if (e.target.value === 'money') {
                amountGroup.style.display = 'block';
                document.getElementById('amount').required = true;
            } else {
                amountGroup.style.display = 'none';
                document.getElementById('amount').required = false;
            }
        });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterDonations);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', filterDonations);
    }
}

async function loadPageContent() {
    const path = window.location.pathname;

    if (path.includes('index.html') || path.endsWith('/')) {
        await loadHomeStats();
    } else if (path.includes('donors.html')) {
        await loadDonations();
    } else if (path.includes('profile.html')) {
        await loadProfile();
        await loadMyDonations();
    }
}

async function loadHomeStats() {
    try {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('amount, donation_type');

        if (error) throw error;

        const totalDonations = donations.length;
        const totalAmount = donations
            .filter(d => d.donation_type === 'money')
            .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        document.getElementById('totalDonations').textContent = totalDonations;
        document.getElementById('totalAmount').textContent = `₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

let allDonations = [];

async function loadDonations() {
    try {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allDonations = donations;
        displayDonations(donations);
    } catch (error) {
        console.error('Error loading donations:', error);
        const container = document.getElementById('donationsContainer');
        if (container) {
            container.innerHTML = '<p class="loading">Error loading donations.</p>';
        }
    }
}

function displayDonations(donations) {
    const container = document.getElementById('donationsContainer');
    if (!container) return;

    if (donations.length === 0) {
        container.innerHTML = '<p class="loading">No donations found.</p>';
        return;
    }

    container.innerHTML = donations.map(donation => `
        <div class="donation-card">
            <div class="donor-info">
                <h3>${donation.donor_name}</h3>
                ${donation.message ? `<p>${donation.message}</p>` : ''}
            </div>
            <div class="amount">
                ${donation.donation_type === 'money' ? `₱${parseFloat(donation.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'N/A'}
            </div>
            <div class="type type-${donation.donation_type}">
                ${donation.donation_type.charAt(0).toUpperCase() + donation.donation_type.slice(1)}
            </div>
            <div class="date">
                ${new Date(donation.created_at).toLocaleDateString('en-PH')}
            </div>
        </div>
    `).join('');
}

function filterDonations() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;

    let filtered = allDonations;

    if (searchTerm) {
        filtered = filtered.filter(d =>
            d.donor_name.toLowerCase().includes(searchTerm) ||
            (d.message && d.message.toLowerCase().includes(searchTerm))
        );
    }

    if (typeFilter !== 'all') {
        filtered = filtered.filter(d => d.donation_type === typeFilter);
    }

    displayDonations(filtered);
}

async function handleDonation(e) {
    e.preventDefault();

    const donorName = document.getElementById('donorName').value;
    const donationType = document.getElementById('donationType').value;
    const message = document.getElementById('message').value;

    let amount = 0;
    if (donationType === 'money') {
        amount = parseFloat(document.getElementById('amount').value);
        if (amount <= 0) {
            showError('Please enter a valid amount.');
            return;
        }
    }

    try {
        const { error } = await supabase
            .from('donations')
            .insert([
                {
                    user_id: currentUser.id,
                    donor_name: donorName,
                    amount: amount,
                    donation_type: donationType,
                    message: message || null,
                    status: 'confirmed'
                }
            ]);

        if (error) throw error;

        showSuccess('Thank you for your donation! Your contribution has been recorded.');
        document.getElementById('donationForm').reset();

        setTimeout(() => {
            window.location.href = 'donors.html';
        }, 2000);
    } catch (error) {
        showError('An error occurred while processing your donation. Please try again.');
        console.error('Donation error:', error);
    }
}

async function loadProfile() {
    if (!currentUser || !currentUser.profile) return;

    const profile = currentUser.profile;

    document.getElementById('fullName').value = profile.full_name || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('address').value = profile.address || '';
}

async function loadMyDonations() {
    try {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('myDonationsContainer');
        if (!container) return;

        if (donations.length === 0) {
            container.innerHTML = '<p class="loading">You have not made any donations yet.</p>';
            return;
        }

        container.innerHTML = donations.map(donation => `
            <div class="my-donation-item">
                <h4>${donation.donation_type === 'money' ? `₱${parseFloat(donation.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : donation.donation_type.charAt(0).toUpperCase() + donation.donation_type.slice(1)}</h4>
                <p><strong>Date:</strong> ${new Date(donation.created_at).toLocaleDateString('en-PH')}</p>
                <p><strong>Status:</strong> ${donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}</p>
                ${donation.message ? `<p><strong>Message:</strong> ${donation.message}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading my donations:', error);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone || null,
                address: address || null
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        showSuccess('Profile updated successfully!');
    } catch (error) {
        showError('An error occurred while updating your profile. Please try again.');
        console.error('Profile update error:', error);
    }
}

async function handleLogout(e) {
    e.preventDefault();

    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }

    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.classList.remove('show');
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
    }

    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}
