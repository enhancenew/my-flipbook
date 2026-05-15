(async function() {
    try {
        // Fetch config to check if notifications are enabled
        const configRes = await fetch('notifications/config.json');
        const config = await configRes.json();

        if (!config.enabled) {
            console.log('Notifications are disabled.');
            return;
        }

        // Initialize EmailJS if public key is provided
        if (config.service === 'emailjs' && config.emailjs_config.user_id && config.emailjs_config.user_id !== 'YOUR_PUBLIC_KEY') {
            if (typeof emailjs !== 'undefined') {
                emailjs.init(config.emailjs_config.user_id);
            }
        }

        // Gather visitor info
        let visitorData = {};
        try {
            const infoRes = await fetch('https://ipapi.co/json/');
            visitorData = await infoRes.json();
        } catch (e) {
            console.warn('Could not fetch location data:', e);
        }

        const details = {
            ip: visitorData.ip || 'Unknown',
            location: `${visitorData.city || 'Unknown'}, ${visitorData.region || ''} ${visitorData.country_name || ''}`,
            org: visitorData.org || 'Unknown',
            device: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toLocaleString(),
            url: window.location.href,
            screen: `${window.screen.width}x${window.screen.height}`,
            recipient: config.recipient_email
        };

        console.log('Access Notification Details:', details);

        // Notify via EmailJS if configured and script is loaded
        if (config.service === 'emailjs' && typeof emailjs !== 'undefined' && config.emailjs_config.service_id !== 'YOUR_SERVICE_ID') {
            emailjs.send(config.emailjs_config.service_id, config.emailjs_config.template_id, {
                to_email: config.recipient_email,
                subject: 'New Website Access: ' + details.ip,
                details: JSON.stringify(details, null, 2),
                ip: details.ip,
                location: details.location,
                device: details.device,
                timestamp: details.timestamp
            }).then(() => {
                console.log('Notification email sent to ' + config.recipient_email);
            }).catch((err) => {
                console.error('Failed to send notification email:', err);
            });
        }

    } catch (error) {
        console.error('Error in notification script:', error);
    }
})();
