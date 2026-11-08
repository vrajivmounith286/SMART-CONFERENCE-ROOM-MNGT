// ===== SEED DATA — Orientbell Conference Room Management =====
// No predefined users, bookings, or notifications — all users must register via Firebase Auth
export function getSeedData() {
    const offices = [
        { id: 'off1', name: 'Orientbell HQ — New Delhi', address: 'Iris Tech Park, Sector 48, Sohna Road, Gurugram' },
        { id: 'off2', name: 'Manufacturing Plant — Sikandrabad', address: 'Sikandrabad Industrial Area, Bulandshahr, UP' },
        { id: 'off3', name: 'Experience Center — Mumbai', address: 'Andheri East, Mumbai, Maharashtra' },
    ];

    const rooms = [
        { id: 'r1', name: 'Cool Tiles Boardroom', officeId: 'off1', floor: '5th Floor', capacity: 20, status: 'available', equipment: ['projector', 'whiteboard', 'video-conferencing', 'air-conditioning'], icon: 'fa-snowflake', zoomLink: 'https://zoom.us/j/123456789', description: 'Executive boardroom with panoramic views, named after our flagship Cool Tiles line.' },
        { id: 'r2', name: 'Germ-Free Meeting Room', officeId: 'off1', floor: '3rd Floor', capacity: 10, status: 'available', equipment: ['tv-screen', 'whiteboard', 'air-conditioning', 'sanitizer-station'], icon: 'fa-shield-virus', zoomLink: 'https://zoom.us/j/234567890', description: 'Sanitized environment with Germ-Free tile surfaces and air purification.' },
        { id: 'r3', name: 'Forever Tiles Hub', officeId: 'off1', floor: '4th Floor', capacity: 8, status: 'available', equipment: ['tv-screen', 'phone', 'whiteboard'], icon: 'fa-infinity', zoomLink: '', description: 'Collaborative space showcasing durable Forever Tiles collection.' },
        { id: 'r4', name: 'School Tiles Studio', officeId: 'off1', floor: '2nd Floor', capacity: 15, status: 'available', equipment: ['projector', 'whiteboard', 'video-conferencing', 'speaker-system'], icon: 'fa-graduation-cap', zoomLink: 'https://zoom.us/j/456789012', description: 'Training and workshop room featuring School Tiles design theme.' },
        { id: 'r5', name: 'Innovation Lab', officeId: 'off2', floor: '1st Floor', capacity: 12, status: 'available', equipment: ['projector', 'whiteboard', 'video-conferencing', '3d-printer'], icon: 'fa-lightbulb', zoomLink: 'https://zoom.us/j/567890123', description: 'R&D collaboration space in the manufacturing plant.' },
        { id: 'r6', name: 'Production War Room', officeId: 'off2', floor: 'Ground Floor', capacity: 6, status: 'available', equipment: ['tv-screen', 'phone', 'production-dashboard'], icon: 'fa-industry', zoomLink: '', description: 'Quick huddle room for production team coordination.' },
        { id: 'r7', name: 'Design Showcase Room', officeId: 'off3', floor: '2nd Floor', capacity: 16, status: 'available', equipment: ['projector', 'video-conferencing', 'tile-display-wall', 'speaker-system'], icon: 'fa-palette', zoomLink: 'https://zoom.us/j/789012345', description: 'Client-facing room with live tile displays in Mumbai center.' },
        { id: 'r8', name: 'Executive Suite', officeId: 'off3', floor: '3rd Floor', capacity: 8, status: 'maintenance', equipment: ['video-conferencing', 'whiteboard', 'mini-kitchen'], icon: 'fa-crown', zoomLink: 'https://zoom.us/j/890123456', description: 'Premium meeting suite for VIP client meetings.' },
    ];

    const settings = {
        autoReleaseMinutes: 15,
        maxBookingDurationHours: 4,
        advanceBookingDays: 30,
        workingHoursStart: '08:00',
        workingHoursEnd: '20:00',
        brandName: 'Orientbell',
        brandTagline: 'Smart Conference Room Management',
        allowRecurring: true,
        requireApproval: false,
        signageRotateSeconds: 10,
    };

    return {
        users: [],
        offices,
        rooms,
        bookings: [],
        notifications: [],
        settings,
    };
}
